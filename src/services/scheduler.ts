import cron from "node-cron";
import { Logger } from "./logger";
import { runPipeline } from "./pipeline";

export function initializeScheduler() {
  Logger.info("Initializing Automatic Scheduler");

  // 7 AM Job (Daily)
  cron.schedule("0 7 * * *", async () => {
    Logger.info("Triggering scheduled execution: 7 AM");
    await runPipeline();
  });

  // 3 PM Job (Daily)
  cron.schedule("0 15 * * *", async () => {
    Logger.info("Triggering scheduled execution: 3 PM");
    await runPipeline();
  });

  // Monday Rule Job (e.g., Special 8 AM job every Monday)
  // Assumes the user meant a specific Monday-only execution.
  cron.schedule("0 8 * * 1", async () => {
    Logger.info("Triggering scheduled execution: Monday Rule");
    await runPipeline();
  });

  Logger.info("Scheduler configured: 7 AM, 3 PM, and Monday Rule jobs loaded.");
}

// If run directly (e.g., `npx tsx src/services/scheduler.ts`)
if (require.main === module) {
  initializeScheduler();
  // Keep alive
  setInterval(() => {}, 1000 * 60 * 60);
}
