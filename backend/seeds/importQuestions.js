import dotenv from "dotenv";

import { connectDB } from "../config/db.js";

import Question from "../models/Question.js";

import { questions } from "./questions.js";

dotenv.config();

await connectDB();

try {
  await Question.deleteMany();

  await Question.insertMany(questions);

  console.log("Questions Imported");

  process.exit();
} catch (error) {
  console.error(error);

  process.exit(1);
}