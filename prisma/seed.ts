/**
 * @file seed.ts
 * @description Seeds the database with sample data for local development.
 *
 * Run with: `npx prisma db seed`
 *
 * Creates a sample project with a user message and an AI response
 * (including a code fragment) so you can test the UI without waiting
 * for the AI agent to complete.
 */

import { PrismaClient } from "../src/generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

export async function main() {
  console.log("🌱 Seeding database...");

  // Create a sample project with messages
  const project = await prisma.project.create({
    data: {
      name: "sample-todo-app",
      messages: {
        create: [
          {
            content: "Build a simple todo app with add and delete functionality",
            role: "USER",
            type: "RESULT",
          },
          {
            content:
              "<task_summary>Created a todo app with add, delete, and toggle features using Shadcn UI components and Tailwind CSS.</task_summary>",
            role: "ASSISTANT",
            type: "RESULT",
            fragment: {
              create: {
                sandboxUrl: "https://example.e2b.dev",
                title: "Todo App",
                files: {
                  "app/page.tsx": "// Sample todo app code",
                },
              },
            },
          },
        ],
      },
    },
  });

  console.log(`✅ Created sample project: ${project.name} (${project.id})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });