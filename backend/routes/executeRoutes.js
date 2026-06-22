import express from "express";
import { executeCode } from "../controllers/executeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/api/execute", protect, executeCode);

export default router;
