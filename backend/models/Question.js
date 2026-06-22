import mongoose from "mongoose";

const exampleSchema = new mongoose.Schema(
  {
    input: {
      type: String,
    },

    output: {
      type: String,
    },

    explanation: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
    },

    output: {
      type: String,
    },

    isHidden: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const starterCodeSchema = new mongoose.Schema(
  {
    javascript: String,
    python: String,
    cpp: String,
    java: String,
  },
  {
    _id: false,
  }
);

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },

    topics: [
      {
        type: String,
      },
    ],

    examples: [exampleSchema],

    constraints: [
      {
        type: String,
      },
    ],

    starterCode: starterCodeSchema,

    testCases: [testCaseSchema],
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model(
  "Question",
  questionSchema
);

export default Question;