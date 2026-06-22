import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Lobby from "../models/Lobby.js";

// Fetch user profile details
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update user profile details
export const updateProfile = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userId = req.user.id;

    if (!username || !email) {
      return res.status(400).json({ message: "Username and email are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if new email is already taken by a different user
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: "Email is already taken" });
      }
      user.email = email.toLowerCase();
    }

    user.username = username;

    // If new password is provided, hash and update it
    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rating: user.rating,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete user profile
export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.deleteOne({ _id: userId });

    res.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete profile error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get active lobby/contest for the user
export const getActiveLobby = async (req, res) => {
  try {
    const userId = req.user.id;
    const activeLobby = await Lobby.findOne({
      participants: userId,
      status: "started"
    }).sort({ updatedAt: -1 });

    if (activeLobby) {
      return res.json({
        active: true,
        code: activeLobby.code,
        status: activeLobby.status,
      });
    }

    res.json({ active: false });
  } catch (error) {
    console.error("Get active lobby error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
