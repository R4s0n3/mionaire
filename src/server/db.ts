import { PrismaClient } from "@prisma/client";

import { env } from "@/env";
import { setupCronJobs } from "./cron";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Setup cron jobs when the module is loaded (server startup)
if (typeof window === "undefined") {
  // Ensure it's server-side
  setupCronJobs();
}
