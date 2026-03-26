import { generateQuestionSet } from "./src/server/ai/question-generator";
import { GameMode } from "@prisma/client";

async function testPrompt() {
  console.log("Testing NORMAL mode with 5 themes...");

  try {
    const result = await generateQuestionSet(GameMode.NORMAL, [
      "Science",
      "History",
      "Geography",
      "Literature",
      "Sports",
    ]);
    console.log("✅ Success!");
    console.log(`Generated ${result.questions.length} questions`);
    console.log("\nFirst question:");
    console.log(JSON.stringify(result.questions[0], null, 2));
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

testPrompt();
