import Lobby from "../models/Lobby.js";
import generateLobbyCode from "../utils/generateLobbyCode.js";
import { io } from "../server.js";
import Question from "../models/Question.js";
import { runCodeAgainstTestCases } from "./executeController.js";

export const createLobby = async (req, res) => {
  try {
    const {
      questionCount,
      difficulty,
      visibility,
      duration,
      topics,
      maxPlayers,
    } = req.body;

    const userId = req.user.id;

    let code;

    while (true) {
      code = generateLobbyCode();

      const existingLobby = await Lobby.findOne({
        code,
      });

      if (!existingLobby) {
        break;
      }
    }

    const mappedTopics = topics.flatMap((t) => {
      const mapping = {
        "Arrays": ["Array"],
        "Strings": ["String"],
        "Hashing": ["Hash Table", "Hash Function", "Rolling Hash"],
        "Trees": ["Tree", "Binary Tree", "Binary Search Tree", "Segment Tree", "Binary Indexed Tree"],
        "Heap": ["Heap (Priority Queue)"],
      };
      return mapping[t] || [t];
    });

    let filter = {
      topics: { $in: mappedTopics },
    };

    if (difficulty !== "Mixed") {
      filter.difficulty = difficulty;
    }

    const selectedQuestions = await Question.aggregate([
      {
        $match: filter,
      },
      {
        $sample: {
          size: questionCount,
        },
      },
    ]);

    const lobby = await Lobby.create({
      code,
      host: userId,
      questionCount,
      difficulty,
      visibility,
      duration,
      topics,
      maxPlayers: maxPlayers || 10,
      questions: selectedQuestions.map((question) => question._id),
      participants: [userId],
    });

    if (visibility === "Public") {
      io.emit("publicLobbiesUpdated");
    }

    res.status(201).json({
      message: "Lobby created successfully",
      lobby,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create lobby",
    });
  }
};

export const joinLobby = async (req, res) => {
  try {
    const { code } = req.body;

    const userId = req.user.id;

    const lobby = await Lobby.findOne({
      code: code.toUpperCase(),
    });

    if (!lobby) {
      return res.status(404).json({
        message: "Lobby not found",
      });
    }

    if (lobby.status !== "waiting") {
      return res.status(400).json({
        message: "Contest already started",
      });
    }

    const alreadyJoined = lobby.participants.some(
      (participant) =>
        participant.toString() === userId
    );

    if (!alreadyJoined) {
      if (lobby.maxPlayers && lobby.participants.length >= lobby.maxPlayers) {
        return res.status(400).json({
          message: `Lobby is full. Max player limit is ${lobby.maxPlayers}.`,
        });
      }
      lobby.participants.push(userId);
      await lobby.save();
      io.to(lobby.code).emit("lobbyUpdated");
      if (lobby.visibility === "Public") {
        io.emit("publicLobbiesUpdated");
      }
    }

    res.json({
      message: "Joined lobby successfully",
      lobby,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to join lobby",
    });
  }
};

export const getLobby = async (req, res) => {
  try {
    const lobby = await Lobby.findOne({
      code: req.params.code.toUpperCase(),
    })
      .populate("host", "username email")
      .populate("participants", "username email");

    if (!lobby) {
      return res.status(404).json({
        message: "Lobby not found",
      });
    }

    res.json(lobby);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch lobby",
    });
  }
};

export const leaveLobby = async (req, res) => {
  try {
    const userId = req.user.id;

    const lobby = await Lobby.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!lobby) {
      return res.status(404).json({
        message: "Lobby not found",
      });
    }

    if (lobby.host.toString() === userId) {
      await Lobby.deleteOne({
        _id: lobby._id,
      });
      io.to(lobby.code).emit("lobbyDeleted");
      if (lobby.visibility === "Public") {
        io.emit("publicLobbiesUpdated");
      }
      return res.json({
        message: "Host left. Lobby deleted.",
        deleted: true,
      });
    }

    lobby.participants = lobby.participants.filter(
      (participant) =>
        participant.toString() !== userId
    );

    await lobby.save();
    io.to(lobby.code).emit("lobbyUpdated");
    if (lobby.visibility === "Public") {
      io.emit("publicLobbiesUpdated");
    }
    res.json({
      message: "Left lobby successfully",
      deleted: false,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to leave lobby",
    });
  }
};

export const startContest = async (req, res) => {
  try {
    const userId = req.user.id;

    const lobby = await Lobby.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!lobby) {
      return res.status(404).json({
        message: "Lobby not found",
      });
    }

    if (lobby.host.toString() !== userId) {
      return res.status(403).json({
        message: "Only host can start the contest",
      });
    }

    lobby.status = "started";

    lobby.contestStartedAt = new Date();

    lobby.contestEndsAt = new Date(
      Date.now() + lobby.duration * 60 * 1000
    );

    await lobby.save();

    io.to(lobby.code).emit("contestStarted");
    if (lobby.visibility === "Public") {
      io.emit("publicLobbiesUpdated");
    }

    res.json({
      message: "Contest started",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to start contest",
    });
  }
};

const getPublicAndPrivateTestCases = (question) => {
  const allTCs = (question.testCases || []).map(tc => tc.toObject ? tc.toObject() : tc);
  let publicTCs = [];
  let privateTCs = [];

  if (allTCs.length === 0) {
    publicTCs = [
      { input: "", output: "", isHidden: false },
      { input: "", output: "", isHidden: false },
      { input: "", output: "", isHidden: false }
    ];
    privateTCs = [
      { input: "", output: "", isHidden: true },
      { input: "", output: "", isHidden: true }
    ];
    return { publicTCs, privateTCs };
  }

  // 1. Build public test cases (exactly 3)
  for (let i = 0; i < 3; i++) {
    if (i < allTCs.length) {
      publicTCs.push({ ...allTCs[i], isHidden: false });
    } else {
      const source = allTCs[i % allTCs.length];
      publicTCs.push({ ...source, isHidden: false });
    }
  }

  // 2. Build private test cases (exactly 2)
  const remainingTCs = allTCs.slice(3);
  if (remainingTCs.length >= 2) {
    privateTCs = remainingTCs.slice(0, 2).map(tc => ({ ...tc, isHidden: true }));
  } else {
    const pool = remainingTCs.length > 0 ? remainingTCs : allTCs;
    for (let i = 0; i < 2; i++) {
      if (i < remainingTCs.length) {
        privateTCs.push({ ...remainingTCs[i], isHidden: true });
      } else {
        const sourceIndex = (pool.length - 1 - i + pool.length) % pool.length;
        privateTCs.push({ ...pool[sourceIndex], isHidden: true });
      }
    }
  }

  return { publicTCs, privateTCs };
};

export const getContest = async (req, res) => {
  try {
    const lobby = await Lobby.findOne({
      code: req.params.code.toUpperCase(),
    })
      .populate("questions")
      .populate("participants", "username email");

    if (!lobby) {
      return res.status(404).json({
        message: "Contest not found",
      });
    }

    if (lobby.status !== "started") {
      return res.status(403).json({
        message: "Contest has not started",
      });
    }

    const questions = lobby.questions.map(
      (question) => {
        const { publicTCs } = getPublicAndPrivateTestCases(question);

        return {
          _id: question._id,
          title: question.title,
          description: question.description,
          difficulty: question.difficulty,
          examples: question.examples,
          constraints: question.constraints,
          starterCode: question.starterCode,
          testCases: publicTCs.map(tc => ({ input: tc.input, output: tc.output })),
        };
      }
    );

    res.json({
      code: lobby.code,
      host: lobby.host,
      duration: lobby.duration,
      contestEndsAt: lobby.contestEndsAt,
      questions,
      scores: lobby.scores ? Object.fromEntries(lobby.scores) : {},
      solvedQuestions: lobby.solvedQuestions ? Object.fromEntries(lobby.solvedQuestions) : {},
      participants: lobby.participants ? lobby.participants.map(p => ({
        _id: p._id,
        username: p.username,
        email: p.email
      })) : []
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch contest",
    });
  }
};

export const submitCode = async (req, res) => {
  try {
    const { code } = req.params;
    const { questionId, language, codeValue } = req.body;
    const userId = req.user.id;

    const lobby = await Lobby.findOne({ code: code.toUpperCase() }).populate("questions").populate("participants", "username email");
    if (!lobby) {
      return res.status(404).json({ message: "Contest not found" });
    }

    if (lobby.status !== "started" || (lobby.contestEndsAt && new Date() > new Date(lobby.contestEndsAt))) {
      if (lobby.status === "started") {
        lobby.status = "finished";
        await lobby.save();
      }
      return res.status(400).json({ message: "Contest has already finished" });
    }

    // Verify participant
    const isParticipant = lobby.participants.some(
      (p) => p._id.toString() === userId
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "You are not a participant in this contest" });
    }

    // Find question within contest questions
    const hasQuestion = lobby.questions.some(
      (q) => q._id.toString() === questionId
    );
    if (!hasQuestion) {
      return res.status(400).json({ message: "Question is not part of this contest" });
    }

    // Fetch full question details (with hidden test cases)
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Ensure exactly 3 public and 2 private test cases are used for submission
    const { publicTCs, privateTCs } = getPublicAndPrivateTestCases(question);
    const submissionTestCases = [...publicTCs, ...privateTCs];

    // Run code against all test cases (3 public + 2 private)
    const executionResult = await runCodeAgainstTestCases(
      language,
      codeValue,
      submissionTestCases
    );

    if (executionResult.compileError) {
      return res.json({
        success: false,
        compileError: executionResult.compileError,
        message: "Compilation Error"
      });
    }

    if (!executionResult.allPassed) {
      // Split results to sanitize private ones
      const publicResults = executionResult.results.slice(0, 3);
      const privateResults = executionResult.results.slice(3, 5);

      const sanitizedPrivateResults = privateResults.map(r => ({
        passed: r.passed,
        // Strip out input/output/error to keep them hidden from user
      }));

      return res.json({
        success: false,
        results: [...publicResults, ...sanitizedPrivateResults],
        message: "Some test cases failed."
      });
    }

    // If all passed, assign points
    const pointsMap = {
      Easy: 100,
      Medium: 250,
      Hard: 500,
    };
    const points = pointsMap[question.difficulty] || 100;

    // Ensure maps exist
    if (!lobby.scores) lobby.scores = new Map();
    if (!lobby.solvedQuestions) lobby.solvedQuestions = new Map();

    const userSolved = lobby.solvedQuestions.get(userId) || [];
    const isAlreadySolved = userSolved.some(
      (s) => s.question && s.question.toString() === questionId.toString()
    );

    let pointsAdded = 0;
    if (!isAlreadySolved) {
      // Add points
      const currentScore = lobby.scores.get(userId) || 0;
      lobby.scores.set(userId, currentScore + points);

      userSolved.push({ question: questionId, solvedAt: new Date() });
      lobby.solvedQuestions.set(userId, userSolved);

      pointsAdded = points;
      await lobby.save();

      // Emit socket event to notify other players of the score change
      const participant = lobby.participants.find(p => p._id.toString() === userId.toString());
      const username = participant ? participant.username : "Someone";

      io.to(lobby.code).emit("scoreUpdated", {
        userId,
        username,
        questionTitle: question.title,
        pointsAdded: points,
        scores: Object.fromEntries(lobby.scores),
        solvedQuestions: Object.fromEntries(lobby.solvedQuestions),
      });
    }

    return res.json({
      success: true,
      message: isAlreadySolved ? "All test cases passed! (Already solved)" : "All test cases passed! Points awarded.",
      pointsAdded,
      scores: Object.fromEntries(lobby.scores),
      solvedQuestions: Object.fromEntries(lobby.solvedQuestions),
    });

  } catch (error) {
    console.error("Submission error:", error);
    return res.status(500).json({
      message: "An error occurred during submission",
      error: error.message
    });
  }
};

export const getResults = async (req, res) => {
  try {
    const lobby = await Lobby.findOne({
      code: req.params.code.toUpperCase(),
    })
      .populate("questions")
      .populate("participants", "username email");

    if (!lobby) {
      return res.status(404).json({
        message: "Contest not found",
      });
    }

    // Auto-finalize contest status to finished if time has passed
    if (lobby.status === "started" && lobby.contestEndsAt && new Date() > new Date(lobby.contestEndsAt)) {
      lobby.status = "finished";
      await lobby.save();
    }

    res.json({
      code: lobby.code,
      status: lobby.status,
      duration: lobby.duration,
      contestStartedAt: lobby.contestStartedAt,
      contestEndsAt: lobby.contestEndsAt,
      questions: lobby.questions.map((q) => ({
        _id: q._id,
        title: q.title,
        difficulty: q.difficulty,
      })),
      scores: lobby.scores ? Object.fromEntries(lobby.scores) : {},
      solvedQuestions: lobby.solvedQuestions ? Object.fromEntries(lobby.solvedQuestions) : {},
      participants: lobby.participants.map((p) => ({
        _id: p._id,
        username: p.username,
        email: p.email,
      })),
    });

  } catch (error) {
    console.error("Fetch results error:", error);
    res.status(500).json({
      message: "Failed to fetch contest results",
    });
  }
};

export const endContest = async (req, res) => {
  try {
    const userId = req.user.id;
    const lobby = await Lobby.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!lobby) {
      return res.status(404).json({
        message: "Lobby not found",
      });
    }

    if (lobby.host.toString() !== userId) {
      return res.status(403).json({
        message: "Only host can end the contest",
      });
    }

    lobby.status = "finished";
    lobby.contestEndsAt = new Date();
    await lobby.save();

    io.to(lobby.code).emit("contestEnded");

    res.json({
      message: "Contest ended",
    });

  } catch (error) {
    console.error("End contest error:", error);
    res.status(500).json({
      message: "Failed to end contest",
    });
  }
};

export const getUserHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all finished lobbies where the user was a participant
    const lobbies = await Lobby.find({
      participants: userId,
      status: "finished",
    })
      .populate("questions", "title difficulty")
      .sort({ contestEndsAt: -1 });

    const history = lobbies.map((lobby) => {
      const userScore = lobby.scores ? (lobby.scores.get(userId.toString()) || 0) : 0;
      const userSolved = lobby.solvedQuestions ? (lobby.solvedQuestions.get(userId.toString()) || []) : [];

      return {
        _id: lobby._id,
        code: lobby.code,
        difficulty: lobby.difficulty,
        duration: lobby.duration,
        contestEndsAt: lobby.contestEndsAt || lobby.updatedAt,
        participantCount: lobby.participants.length,
        questionCount: lobby.questions.length,
        userScore,
        solvedCount: userSolved.length,
      };
    });

    res.json(history);
  } catch (error) {
    console.error("Fetch user history error:", error);
    res.status(500).json({
      message: "Failed to fetch contest history",
      error: error.message,
    });
  }
};

export const getPublicLobbies = async (req, res) => {
  try {
    const lobbies = await Lobby.find({
      visibility: "Public",
      status: "waiting",
    })
      .populate("host", "username email")
      .sort({ createdAt: -1 });

    res.json(lobbies);
  } catch (error) {
    console.error("Fetch public lobbies error:", error);
    res.status(500).json({
      message: "Failed to fetch public lobbies",
      error: error.message,
    });
  }
};

