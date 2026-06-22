import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || "267517179806-cuehpm0dv2q4op75qkm6t5hcnnc8mao7.apps.googleusercontent.com"
);

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};


export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience:
        "267517179806-cuehpm0dv2q4op75qkm6t5hcnnc8mao7.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();

    const { email, name } = payload;

    let user = await User.findOne({
      email,
    });

    if (!user) {
      user = await User.create({
        username: name,
        email,
        password: await bcrypt.hash(
          Math.random().toString(36),
          10
        ),
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rating: user.rating,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      message: "Google authentication failed",
    });
  }
};