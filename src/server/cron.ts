import cron from "node-cron";
import { generateDailyQuestions } from "./jobs/daily-question-generator";

// Schedule daily question generation at 1 AM CET (UTC+1, so 00:00 UTC in winter, 23:00 UTC in summer)
// CET is Europe/Paris timezone
// 1 AM CET = midnight UTC during standard time, 11 PM UTC during DST
// To handle DST, use cron expression with timezone, but node-cron doesn't support timezone directly
// So use 0 1 * * * for 1 AM server time, assuming server is in CET or adjust

export function setupCronJobs() {
  // Run every day at 1 AM (server time)
  // Note: Adjust if server timezone is not CET
  cron.schedule("0 1 * * *", async () => {
    console.log("Running scheduled daily question generation...");
    try {
      await generateDailyQuestions();
    } catch (error) {
      console.error("Scheduled generation failed:", error);
    }
  });

  console.log("Cron jobs scheduled");
}
