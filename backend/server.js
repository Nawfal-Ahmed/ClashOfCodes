import express from "express";
import http from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./sockets/lobbySocket.js";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import lobbyRoutes from "./routes/lobbyRoutes.js";
import executeRoutes from "./routes/executeRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  },
});

app.use(cors());
app.use(express.json());

connectDB();
initializeSocket(io);
app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.use(authRoutes);
app.use(lobbyRoutes);
app.use(executeRoutes);
app.use(userRoutes);

server.listen(process.env.PORT, () => {
  console.log(
    `Server running on port ${process.env.PORT}`
  );
});