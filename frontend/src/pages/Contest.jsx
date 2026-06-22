import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ContestHeader from "../components/contest/ContestHeader";
import QuestionNavigator from "../components/contest/QuestionNavigator";
import QuestionPanel from "../components/contest/QuestionPanel";
import CodeEditorPanel from "../components/contest/CodeEditorPanel";
import TestCasePanel from "../components/contest/TestCasePanel";
import LeaderboardModal from "../components/contest/LeaderboardModal";
import socket from "../socket";

export default function Contest() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [testStatuses, setTestStatuses] = useState({});
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);

  const [timeLeft, setTimeLeft] = useState(0);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [currentTestCase, setCurrentTestCase] =
    useState(0);

  const [language, setLanguage] =
    useState("javascript");

  const [running, setRunning] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitResult, setSubmitResult] =
    useState(null);

  const [showLeaderboard, setShowLeaderboard] =
    useState(false);

  const [showEndContestConfirm, setShowEndContestConfirm] =
    useState(false);

  const [toasts, setToasts] =
    useState([]);

  const addToast = (username, questionTitle, pointsAdded) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, username, questionTitle, pointsAdded }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const currentScore = useMemo(() => {
    if (!contest || !currentUser) return 0;
    return contest.scores?.[currentUser.id] || 0;
  }, [contest, currentUser]);

  const solvedQuestions = useMemo(() => {
    if (!contest || !currentUser) return [];
    const solved = contest.solvedQuestions?.[currentUser.id] || [];
    return solved.map((s) =>
      s && typeof s === "object" && s.question
        ? s.question._id || s.question
        : s
    );
  }, [contest, currentUser]);

  /*
    Structure:

    {
      questionId: {
        javascript: "...",
        python: "...",
        cpp: "...",
        java: "..."
      }
    }
  */
  const [questionCodes, setQuestionCodes] =
    useState({});

  /*
    Stores outputs for current question

    {
      questionId: {
        0: "...",
        1: "...",
        2: "..."
      }
    }
  */
  const [testResults, setTestResults] =
    useState({});

  useEffect(() => {
    fetchContest();
  }, []);

  useEffect(() => {
    if (!contest || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [contest]);

  useEffect(() => {
    if (contest && timeLeft === 0) {
      navigate(`/contest/${code}/results`);
    }
  }, [
    contest,
    timeLeft,
    navigate,
    code,
  ]);

  useEffect(() => {
    setCurrentTestCase(0);
    setSubmitResult(null);
  }, [currentQuestion]);

  useEffect(() => {
    if (!contest) return;

    socket.emit("joinLobby", code);

    const handleScoreUpdated = (data) => {
      setContest((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          scores: data.scores,
          solvedQuestions: data.solvedQuestions,
        };
      });

      if (data.userId && data.userId !== currentUser?.id && data.username && data.questionTitle) {
        addToast(data.username, data.questionTitle, data.pointsAdded || 100);
      }
    };

    const handleContestEnded = () => {
      navigate(`/contest/${code}/results`);
    };

    socket.on("scoreUpdated", handleScoreUpdated);
    socket.on("contestEnded", handleContestEnded);

    return () => {
      socket.off("scoreUpdated", handleScoreUpdated);
      socket.off("contestEnded", handleContestEnded);
    };
  }, [contest, code, currentUser, navigate]);

  const fetchContest = async () => {
    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/contest/${code}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setContest(data);

      setTimeLeft(
        Math.max(
          0,
          Math.floor(
            (
              new Date(data.contestEndsAt) -
              new Date()
            ) / 1000
          )
        )
      );
    } catch (error) {
      alert(error.message);

      navigate("/dashboard");
    }

    setLoading(false);
  };

  const handleEndContest = async () => {
    setShowEndContestConfirm(false);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/contest/${code}/end`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to end contest");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const question = useMemo(() => {
    if (!contest) return null;

    return contest.questions[
      currentQuestion
    ];
  }, [
    contest,
    currentQuestion,
  ]);

  const currentQuestionId =
    question?._id;

  const codeValue = useMemo(() => {
    if (!currentQuestionId || !question) return "";

    const savedCode = questionCodes?.[currentQuestionId]?.[language];
    if (savedCode !== undefined) {
      return savedCode;
    }

    return question.starterCode?.[language] || "";
  }, [questionCodes, currentQuestionId, language, question]);

  const setCodeValue = (value) => {
    setQuestionCodes((prev) => ({
      ...prev,

      [currentQuestionId]: {
        ...(prev[
          currentQuestionId
        ] || {}),

        [language]: value,
      },
    }));
  };

  const currentOutputs =
    testResults[
      currentQuestionId
    ] || {};

  const handleRunCode = async () => {
    if (!question || running || submitting) return;

    try {
      setRunning(true);
      setSubmitResult(null);

      const token = localStorage.getItem("token");
      const testCasesToRun = question.testCases || [];

      const promises = testCasesToRun.map(async (tc, index) => {
        try {
          const response = await fetch(
            "http://localhost:5000/api/execute",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                language,
                version: "*",
                files: [
                  {
                    content: codeValue,
                  },
                ],
                stdin: tc.input || "",
              }),
            }
          );

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "Failed to execute");
          }

          const output = (
            data.run?.stdout ||
            data.run?.stderr ||
            data.run?.output ||
            "No output"
          ).trim();

          const expected = (tc.output || "").trim();

          let passed = false;
          try {
            const actObj = JSON.parse(output);
            const expObj = JSON.parse(expected);
            passed = JSON.stringify(actObj) === JSON.stringify(expObj);
          } catch (e) {
            passed = output.replace(/\s+/g, "") === expected.replace(/\s+/g, "");
          }

          return {
            index,
            actual: output,
            status: passed ? "passed" : "failed",
          };
        } catch (err) {
          return {
            index,
            actual: "Runtime Error",
            status: "failed",
          };
        }
      });

      const outputs = await Promise.all(promises);

      setTestResults((prev) => {
        const qResults = { ...(prev[currentQuestionId] || {}) };
        outputs.forEach((o) => {
          qResults[o.index] = o.actual;
        });
        return { ...prev, [currentQuestionId]: qResults };
      });

      setTestStatuses((prev) => {
        const qStatuses = { ...(prev[currentQuestionId] || {}) };
        outputs.forEach((o) => {
          qStatuses[o.index] = o.status;
        });
        return { ...prev, [currentQuestionId]: qStatuses };
      });

    } catch (error) {
      console.error("Run all testcases failed:", error);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!question || submitting) return;

    try {
      setSubmitting(true);
      setSubmitResult(null);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/contest/${code}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionId: question._id,
            language,
            codeValue,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit code");
      }

      setSubmitResult(data);

      if (data.success) {
        setContest((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scores: data.scores,
            solvedQuestions: data.solvedQuestions,
          };
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: error.message || "An error occurred during submission",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Loading Contest...
      </div>
    );
  }

  if (
    !contest ||
    contest.questions.length === 0
  ) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        No questions found.
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      <div className="max-w-7xl mx-auto w-full">

        <ContestHeader
          contest={contest}
          timeLeft={timeLeft}
          score={currentScore}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          isHost={currentUser?.id === contest?.host}
          onEndContest={() => setShowEndContestConfirm(true)}
        />

        <QuestionNavigator
          questions={contest.questions}
          currentQuestion={currentQuestion}
          setCurrentQuestion={
            setCurrentQuestion
          }
          solvedQuestionIds={solvedQuestions}
        />

        {/* Side-by-Side Question and Editor filling viewport height */}
        <div className="grid lg:grid-cols-10 gap-6 h-auto lg:h-[calc(100vh-230px)] min-h-[500px] mb-6">
          
          {/* Left Panel: Description */}
          <div className="lg:col-span-4 h-full min-h-0">
            <QuestionPanel question={question} />
          </div>

          {/* Right Panel: Editor */}
          <div className="lg:col-span-6 h-full min-h-0">
            <CodeEditorPanel
              language={language}
              setLanguage={setLanguage}
              codeValue={codeValue}
              setCodeValue={setCodeValue}
            />
          </div>

        </div>

        {/* Test Case Panel at the bottom (below the fold, scroll down to see) */}
        <TestCasePanel
          testCases={
              question.testCases || []
          }
          currentTestCase={
              currentTestCase
          }
          setCurrentTestCase={
              setCurrentTestCase
          }
          running={running}
          submitting={submitting}
          submitResult={submitResult}
          handleRunCode={
              handleRunCode
          }
          handleSubmit={
              handleSubmit
          }
          testResults={
              currentOutputs
          }
          testStatuses={
              testStatuses[
              currentQuestionId
              ] || {}
          }
        />

      </div>

      {showLeaderboard && (
        <LeaderboardModal
          contest={contest}
          currentUser={currentUser}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Toast Notifications Container */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl flex gap-3 items-center pointer-events-auto animate-slide-in border-l-4 border-l-green-500 text-white"
          >
            <div className="bg-green-500/10 text-green-400 p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-200">
                <span className="text-indigo-400 font-bold">{toast.username}</span> solved a question!
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed <span className="font-semibold text-slate-300">{toast.questionTitle}</span>
              </p>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
              +{toast.pointsAdded} pts
            </div>
          </div>
        ))}
      </div>

      {/* End Contest Confirmation Modal */}
      {showEndContestConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-opacity duration-300">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative overflow-hidden animate-scale-in text-center">
            {/* Red warning decorative glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[50px] pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-3">End Contest?</h3>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              Are you sure you want to end the contest for everyone? This will stop the clash immediately, freeze submissions, and show the final results leaderboard.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowEndContestConfirm(false)}
                className="flex-1 py-3.5 px-5 rounded-2xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-sm transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEndContest}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-red-600/20"
              >
                End Contest
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}