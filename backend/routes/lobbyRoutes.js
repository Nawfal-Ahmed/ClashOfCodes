import express from "express";

import {
  createLobby,
  joinLobby,
  getLobby,
  startContest,
  leaveLobby,
  getContest,
  submitCode,
  getResults,
  endContest,
  getUserHistory,
  getPublicLobbies,
} from "../controllers/lobbyController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/lobbies", protect, createLobby);

router.post("/lobbies/join", protect, joinLobby);

router.get("/lobbies/history", protect, getUserHistory);

router.get("/lobbies/public", protect, getPublicLobbies);

router.get("/lobbies/:code", protect, getLobby);

router.post(
  "/lobbies/:code/start",
  protect,
  startContest
);
router.get(
  "/contest/:code",
  protect,
  getContest
);
router.post(
  "/contest/:code/submit",
  protect,
  submitCode
);
router.get(
  "/contest/:code/results",
  protect,
  getResults
);
router.post(
  "/contest/:code/end",
  protect,
  endContest
);

router.post(
  "/lobbies/:code/leave",
  protect,
  leaveLobby
);

export default router;
// Trigger restart