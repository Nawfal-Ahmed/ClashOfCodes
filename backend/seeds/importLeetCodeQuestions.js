import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Question from "../models/Question.js";
import readline from "readline";
import { Readable } from "stream";

dotenv.config();

const parseExampleText = (text) => {
  let input = "";
  let output = "";
  let explanation = "";

  const cleanText = text.replace(/\*\*/g, "").replace(/\*/g, "");

  const inputMatch = cleanText.match(/Input:\s*([\s\S]*?)(?=Output:|$)/i);
  const outputMatch = cleanText.match(/Output:\s*([\s\S]*?)(?=Explanation:|$)/i);
  const explanationMatch = cleanText.match(/Explanation:\s*([\s\S]*)/i);

  if (inputMatch) input = inputMatch[1].trim();
  if (outputMatch) output = outputMatch[1].trim();
  if (explanationMatch) explanation = explanationMatch[1].trim();

  return { input, output, explanation };
};

const getSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const run = async () => {
  await connectDB();

  try {
    // 1. Fetch old problems (containing starter codes for all languages)
    console.log("Fetching old problems (merged_problems.json)...");
    const oldRes = await fetch(
      "https://raw.githubusercontent.com/neenza/leetcode-problems/master/merged_problems.json"
    );
    if (!oldRes.ok) {
      throw new Error(`Failed to fetch old problems dataset: status ${oldRes.status}`);
    }
    const oldData = await oldRes.json();
    const rawQuestions = oldData.questions || [];
    console.log(`Fetched ${rawQuestions.length} raw questions.`);

    // 2. Fetch new problems (train & test splits of LeetCodeDataset)
    console.log("Fetching newfacade/LeetCodeDataset train & test splits...");
    const trainRes = await fetch(
      "https://huggingface.co/datasets/newfacade/LeetCodeDataset/resolve/main/LeetCodeDataset-train.jsonl"
    );
    const testRes = await fetch(
      "https://huggingface.co/datasets/newfacade/LeetCodeDataset/resolve/main/LeetCodeDataset-test.jsonl"
    );

    if (!trainRes.ok || !testRes.ok) {
      throw new Error("Failed to fetch newfacade/LeetCodeDataset splits from HF.");
    }

    const newMap = new Map();

    const parseJSONLStream = async (response) => {
      const reader = readline.createInterface({
        input: Readable.fromWeb(response.body),
        crlfDelay: Infinity,
      });

      for await (const line of reader) {
        if (!line.trim()) continue;
        try {
          const record = JSON.parse(line);
          if (record.task_id) {
            const slug = record.task_id.toLowerCase().trim();
            newMap.set(slug, record);
          }
        } catch (e) {
          console.error("Failed to parse JSONL line:", e.message);
        }
      }
    };

    console.log("Parsing train split...");
    await parseJSONLStream(trainRes);
    console.log("Parsing test split...");
    await parseJSONLStream(testRes);
    console.log(`Loaded ${newMap.size} unique questions from newfacade/LeetCodeDataset.`);

    // 3. Merge datasets
    console.log("Merging datasets...");
    const processedQuestions = [];
    const seenTitles = new Set();
    let mergeCount = 0;

    for (const q of rawQuestions) {
      if (!q.title || !q.description || !q.difficulty || !q.code_snippets) {
        continue;
      }

      const titleLower = q.title.toLowerCase().trim();
      if (seenTitles.has(titleLower)) {
        continue;
      }

      const javascript = q.code_snippets.javascript || "";
      const python = q.code_snippets.python3 || q.code_snippets.python || "";
      const cpp = q.code_snippets.cpp || "";
      const java = q.code_snippets.java || "";

      if (!javascript && !python && !cpp && !java) {
        continue;
      }

      const examples = (q.examples || []).map((ex) => {
        const parsed = parseExampleText(ex.example_text || "");
        return {
          input: parsed.input || "nums = [2,7,11,15], target = 9",
          output: parsed.output || "[0,1]",
          explanation: parsed.explanation || "",
        };
      });

      if (examples.length === 0) {
        continue;
      }

      // Check for match in newfacade map
      const slug = getSlug(q.title);
      let testCases = [];

      if (newMap.has(slug)) {
        const record = newMap.get(slug);
        const ioCases = record.input_output || [];
        
        if (ioCases.length > 0) {
          testCases = ioCases.map((item, index) => ({
            input: item.input != null ? String(item.input) : "",
            output: item.output != null ? String(item.output) : "",
            isHidden: index >= 3, // first 3 are public, remaining are private
          }));
          mergeCount++;
        }
      }

      // Fallback to original example test cases if no match or empty test cases
      if (testCases.length === 0) {
        testCases = examples.map((ex, index) => ({
          input: ex.input || "",
          output: ex.output || "",
          isHidden: index >= 3,
        }));
      }

      let difficulty = "Easy";
      if (q.difficulty === "Medium" || q.difficulty === "Hard") {
        difficulty = q.difficulty;
      }

      const topics = (q.topics || []).map((t) => t.trim());

      processedQuestions.push({
        title: q.title.trim(),
        description: q.description,
        difficulty,
        topics,
        examples,
        constraints: q.constraints || [],
        starterCode: {
          javascript,
          python,
          cpp,
          java,
        },
        testCases,
      });

      seenTitles.add(titleLower);
    }

    console.log(`Merged and enriched ${mergeCount} questions with newfacade/LeetCodeDataset test cases.`);
    console.log(`Total questions processed: ${processedQuestions.length}. Clearing current database...`);
    
    await Question.deleteMany({});
    console.log("Database cleared.");

    // Seed in batches of 100
    const batchSize = 100;
    for (let i = 0; i < processedQuestions.length; i += batchSize) {
      const batch = processedQuestions.slice(i, i + batchSize);
      await Question.insertMany(batch);
      console.log(
        `Seeded batch ${i / batchSize + 1} (${Math.min(i + batchSize, processedQuestions.length)} / ${processedQuestions.length})`
      );
    }

    console.log("Seeding complete! ClashOfCodes database successfully populated with rich test cases.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding process failed:", error);
    process.exit(1);
  }
};

run();
