import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Compliance guardrail:
// Timeline events and interaction events are append-only. No updates, no deletes.
prisma.$use(async (params, next) => {
  const immutableModels = new Set(["TimelineEvent", "InteractionEvent"]);
  if (params.model && immutableModels.has(params.model)) {
    if (params.action === "update" || params.action === "updateMany") {
      throw new Error(`Immutable model ${params.model}: updates are not allowed`);
    }
    if (params.action === "delete" || params.action === "deleteMany") {
      throw new Error(`Immutable model ${params.model}: deletes are not allowed`);
    }
  }
  return next(params);
});

