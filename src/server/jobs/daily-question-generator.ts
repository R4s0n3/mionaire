import { generateAllDailySets } from "../ai/question-generator";
import { db } from "@/server/db";
import moment from "moment-timezone";

export async function generateDailyQuestions() {
  console.log("Starting daily question generation...");

  try {
    // Generate unique ID for this daily set
    const dailySetId = `daily-${moment().tz("Europe/Paris").format("YYYY-MM-DD")}`;

    // Check if questions already exist for today
    const existingQuestions = await db.question.findFirst({
      where: {
        dailySetId,
        isDaily: true,
      },
    });

    if (existingQuestions) {
      console.log(
        "Daily questions already exist for today, skipping generation.",
      );
      return;
    }

    // Generate all question sets
    const sets = await generateAllDailySets();
    console.log(`Generated ${sets.length} question sets`);

    // Insert questions into database
    for (const set of sets) {
      const questionsData = set.questions.map((q) => ({
        ...q,
        mode: set.mode,
        isDaily: true,
        dailySetId,
        health: 1000, // Default health
      }));

      await db.question.createMany({
        data: questionsData,
      });

      console.log(`Inserted ${questionsData.length} ${set.mode} questions`);
    }

    console.log("Daily question generation completed successfully");
  } catch (error) {
    console.error("Failed to generate daily questions:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateDailyQuestions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
