import express from "express";
import { getProfile, updateProfile, deleteProfile, getActiveLobby } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/users/profile", protect, getProfile);
router.put("/users/profile", protect, updateProfile);
router.delete("/users/profile", protect, deleteProfile);
router.get("/users/active-lobby", protect, getActiveLobby);

export default router;
