import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function Results() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [code]);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/contest/${code}/results`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch contest results");
      }

      setResults(data);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSolveTime = (solvedAtStr, startedAtStr) => {
    if (!solvedAtStr || !startedAtStr) return null;
    const start = new Date(startedAtStr);
    const solved = new Date(solvedAtStr);
    const diff = solved.getTime() - start.getTime();
    return diff > 0 ? diff : 0;
  };

  const formatDuration = (ms) => {
    if (ms === null || ms === undefined || isNaN(ms)) return "N/A";
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Compile rankings
  const rankings = useMemo(() => {
    if (!results || !results.participants) return [];

    const compiled = results.participants.map((player) => {
      const pSolved = results.solvedQuestions[player._id] || [];
      const score = results.scores[player._id] || 0;

      const solveTimes = pSolved
        .map((s) => {
          const elapsed = getSolveTime(s.solvedAt, results.contestStartedAt);
          return {
            questionId: s.question,
            elapsed: elapsed !== null ? elapsed : 0,
            solvedAt: s.solvedAt,
          };
        })
        .sort((a, b) => a.elapsed - b.elapsed);

      // Total duration is the elapsed time of the last solve
      const totalTime = solveTimes.length > 0 ? solveTimes[solveTimes.length - 1].elapsed : 0;

      return {
        ...player,
        score,
        solvedCount: pSolved.length,
        solveTimes,
        totalTime,
      };
    });

    // Sort by:
    // 1. Score descending
    // 2. Total time ascending (faster solver is higher rank)
    // 3. Username alphabetically
    return compiled.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.totalTime !== b.totalTime) {
        return a.totalTime - b.totalTime;
      }
      return a.username.localeCompare(b.username);
    });
  }, [results]);

  // Map of questionId -> question details
  const questionMap = useMemo(() => {
    if (!results || !results.questions) return {};
    return results.questions.reduce((acc, q) => {
      acc[q._id] = q;
      return acc;
    }, {});
  }, [results]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-400 animate-pulse">Calculating standings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl max-w-md w-full text-center shadow-xl">
          <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Error loading results</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Get podium winners
  const firstPlace = rankings[0];
  const secondPlace = rankings[1];
  const thirdPlace = rankings[2];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Contest Completed
              </span>
              <span className="text-slate-500 text-sm font-mono">
                Lobby: {code}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent mt-2">
              Clash Standings
            </h1>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 px-5 py-2.5 rounded-xl transition shadow-lg font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Podium Section */}
        {rankings.length > 0 && (
          <div className="mb-12 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.2 1.8 4 4 4h2.2c.8 1.5 2.1 2.6 3.8 2.9V20H9v2h6v-2h-4v-3.1c1.7-.3 3-1.4 3.8-2.9H17c2.2 0 4-1.8 4-4V7c0-1.1-.9-2-2-2zM7 10H5V7h2v3zm12 0h-2V7h2v3z" />
              </svg>
            </div>

            <h2 className="text-center text-lg font-semibold text-slate-400 tracking-widest uppercase mb-10">
              The Podium
            </h2>

            {/* Podium Grid */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-6 max-w-3xl mx-auto mt-4">
              
              {/* 2nd Place */}
              {secondPlace && (
                <div className="w-full md:w-48 flex flex-col items-center order-2 md:order-1 mt-6 md:mt-0 animate-slide-in">
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-4 w-full text-center shadow-lg mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-300 font-bold mx-auto mb-2 text-sm">
                      2nd
                    </div>
                    <div className="font-bold text-slate-200 truncate">{secondPlace.username}</div>
                    <div className="text-xs text-slate-400 mt-1">{secondPlace.score} pts</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{secondPlace.solvedCount} Solved</div>
                  </div>
                  <div className="w-full h-24 bg-gradient-to-t from-slate-800/40 to-slate-800/10 border-t-2 border-slate-500/50 rounded-t-xl" />
                </div>
              )}

              {/* 1st Place */}
              {firstPlace && (
                <div className="w-full md:w-56 flex flex-col items-center order-1 md:order-2 z-10 animate-slide-in">
                  {/* Crown Icon */}
                  <div className="mb-2 animate-bounce">
                    <svg className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2 22h20v-2H2v2zm1-3h18l-2-9-4 5-3-9-3 9-4-5-2 9zm9-14a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-7.5 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm15 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                    </svg>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/15 via-yellow-600/5 to-transparent border border-yellow-500/30 rounded-3xl p-5 w-full text-center shadow-xl mb-3 ring-2 ring-yellow-500/20">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-extrabold mx-auto mb-2 border border-yellow-500/30 text-base">
                      1st
                    </div>
                    <div className="font-extrabold text-yellow-400 text-lg truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                      {firstPlace.username}
                    </div>
                    <div className="text-sm font-bold text-yellow-400/80 mt-1">{firstPlace.score} pts</div>
                    <div className="text-xs text-yellow-500/70 mt-0.5">{firstPlace.solvedCount} Solved</div>
                  </div>
                  <div className="w-full h-32 bg-gradient-to-t from-yellow-600/25 to-yellow-500/5 border-t-2 border-yellow-500 rounded-t-xl" />
                </div>
              )}

              {/* 3rd Place */}
              {thirdPlace && (
                <div className="w-full md:w-48 flex flex-col items-center order-3 mt-6 md:mt-0 animate-slide-in">
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-4 w-full text-center shadow-lg mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center text-amber-500 font-bold mx-auto mb-2 text-sm">
                      3rd
                    </div>
                    <div className="font-bold text-slate-200 truncate">{thirdPlace.username}</div>
                    <div className="text-xs text-slate-400 mt-1">{thirdPlace.score} pts</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{thirdPlace.solvedCount} Solved</div>
                  </div>
                  <div className="w-full h-16 bg-gradient-to-t from-amber-900/30 to-amber-900/5 border-t-2 border-amber-700/50 rounded-t-xl" />
                </div>
              )}

            </div>
          </div>
        )}

        {/* Leaderboard Table & Timelines */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-200">
              Rankings & Submissions
            </h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700/50 font-medium">
              Sorted by Score & Solve Speed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-950/20">
                  <th className="py-4 px-6 text-center w-20">Rank</th>
                  <th className="py-4 px-6">Player</th>
                  <th className="py-4 px-6 text-center w-40">Questions</th>
                  <th className="py-4 px-6 text-center w-36">Total Time</th>
                  <th className="py-4 px-6 text-right w-36">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rankings.map((player, idx) => {
                  const rank = idx + 1;
                  const isWinner = rank === 1;

                  return (
                    <tr 
                      key={player._id} 
                      className={`hover:bg-slate-800/20 transition-colors group ${
                        isWinner ? "bg-yellow-500/5" : ""
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-5 px-6 text-center font-bold">
                        <div className="flex items-center justify-center">
                          {isWinner ? (
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-black text-sm relative">
                              1
                              <span className="absolute -top-1.5 -right-1.5 text-xs">👑</span>
                            </span>
                          ) : rank === 2 ? (
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-black text-sm">
                              2
                            </span>
                          ) : rank === 3 ? (
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 text-white text-sm">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-sm">{rank}</span>
                          )}
                        </div>
                      </td>

                      {/* Player Username & Solve Timeline */}
                      <td className="py-5 px-6">
                        <div className="flex flex-col gap-2">
                          <span className={`font-semibold text-base ${
                            isWinner ? "text-yellow-400" : "text-white"
                          }`}>
                            {player.username}
                          </span>
                          
                          {/* Solve Timeline badges */}
                          {player.solveTimes.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {player.solveTimes.map((item, solveIdx) => {
                                const question = questionMap[item.questionId];
                                const qTitle = question ? question.title : "Question";
                                const qDiff = question ? question.difficulty : "Easy";
                                
                                return (
                                  <div
                                    key={solveIdx}
                                    className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1 text-xs text-slate-300 shadow-sm"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      qDiff === "Hard"
                                        ? "bg-red-500"
                                        : qDiff === "Medium"
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    }`} />
                                    <span className="font-medium text-slate-200">{qTitle}</span>
                                    <span className="text-slate-500 font-mono">|</span>
                                    <span className="text-green-400 font-bold font-mono">
                                      {formatDuration(item.elapsed)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 italic">No questions solved yet</span>
                          )}
                        </div>
                      </td>

                      {/* Questions Count Column */}
                      <td className="py-5 px-6 text-center">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-950/40 border border-slate-800 text-sm font-semibold">
                          <span className={player.solvedCount > 0 ? "text-green-400" : "text-slate-500"}>
                            {player.solvedCount}
                          </span>
                          <span className="text-slate-600">/</span>
                          <span className="text-slate-400">{results.questions?.length || 0}</span>
                        </div>
                      </td>

                      {/* Total Time Column */}
                      <td className="py-5 px-6 text-center font-mono text-sm">
                        {player.solvedCount > 0 ? (
                          <span className="text-slate-300 font-medium">
                            {formatDuration(player.totalTime)}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Score Column */}
                      <td className="py-5 px-6 text-right">
                        <span className={`text-lg font-black tracking-wider ${
                          isWinner ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.2)]" : "text-indigo-400"
                        }`}>
                          {player.score}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold ml-1">pts</span>
                      </td>
                    </tr>
                  );
                })}

                {rankings.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500 italic">
                      No participants in this contest.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
