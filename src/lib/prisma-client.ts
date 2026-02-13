/**
 * @file prisma-client.ts
 * @description Singleton Prisma Client instance for database access.
 *
 * Uses the PostgreSQL adapter (`@prisma/adapter-pg`) so Prisma can
 * connect via the `pg` driver (required for some serverless/edge setups).
 *
 * In development, the instance is cached on `globalThis` so that
 * Next.js hot-reloads don't create a new database connection each time.
 *
 * ## Usage
 * ```ts
 * import prisma from "@/lib/prisma-client";
 * const projects = await prisma.project.findMany();
 * ```
 */

import { PrismaClient } from "../generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";

/** Extend globalThis to hold the singleton Prisma instance across hot-reloads. */
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

/** PostgreSQL adapter — reads the connection string from DATABASE_URL. */
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

/**
 * The singleton Prisma Client.
 * Reuses an existing instance in development to avoid exhausting DB connections.
 */
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
