/**
 * @file infrastructure/index.ts
 * @description Central wiring layer — instantiates and exports all providers.
 *
 * This is the SINGLE PLACE where concrete implementations are chosen.
 * To switch providers (e.g. E2B → Docker, Inngest → SQS), change the
 * instantiation here — no other file needs to change.
 *
 * ## Provider Switching Guide
 *
 * ### AI Provider
 * Current: OpenRouterProvider (uses OpenRouter via Inngest Agent Kit)
 * To switch to OpenAI direct:
 *   import { OpenAIDirectProvider } from "./ai/openai";
 *   export const aiProvider = new OpenAIDirectProvider();
 *
 * ### Queue Provider
 * Current: InngestQueueProvider
 * To switch to AWS SQS:
 *   import { AWSSQSQueueProvider } from "./queue/aws-sqs";
 *   export const queueProvider = new AWSSQSQueueProvider();
 *
 * ### Sandbox Provider
 * Current: E2BSandboxProvider
 * To switch to Docker:
 *   import { DockerSandboxProvider } from "./sandbox/docker";
 *   export const sandboxProvider = new DockerSandboxProvider();
 *
 * ### Database Provider
 * Current: PrismaDatabaseProvider (PostgreSQL)
 * To switch to another ORM/database, create a new implementation
 * of DatabaseProvider and swap it here.
 */

import type { AIModelConfig } from "@/services/ai";
import { OpenRouterProvider } from "./ai/openrouter";
import { InngestQueueProvider } from "./queue/inngest";
import { E2BSandboxProvider } from "./sandbox/e2b";
import { PrismaDatabaseProvider } from "./database/prisma";
import { EventBus } from "@/core/events/event-bus";
import { SSEEventStreamProvider } from "./events/sse";

// ---------------------------------------------------------------------------
// Provider Singletons
// ---------------------------------------------------------------------------

/** The active AI provider. */
export const aiProvider = new OpenRouterProvider();

/** The active queue provider. */
export const queueProvider = new InngestQueueProvider();

/** The active sandbox provider. */
export const sandboxProvider = new E2BSandboxProvider();

/** The active database provider. */
export const databaseProvider = new PrismaDatabaseProvider();

/** The shared event bus — agents emit into this, transports read from it. */
export const eventBus = new EventBus();

/** The SSE event stream provider — creates SSE streams from the event bus. */
export const eventStreamProvider = new SSEEventStreamProvider(eventBus);

// ---------------------------------------------------------------------------
// AI Configuration
// ---------------------------------------------------------------------------

/**
 * AI model configuration.
 *
 * Reads from environment variables so the model/key can be changed
 * without code changes.
 */
export const aiConfig: AIModelConfig = {
  model: process.env.AI_MODEL || "qwen/qwen3-coder:free",
  // "openai/gpt-oss-120b:free",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseUrl: process.env.AI_BASE_URL || "https://openrouter.ai/api/v1",
  temperature: parseFloat(process.env.AI_TEMPERATURE || "0.1"),
};

// ---------------------------------------------------------------------------
// Inngest Function (created via factory to avoid circular imports)
// ---------------------------------------------------------------------------

import { createDeveloperAgentFunction, inngestClient } from "./queue/inngest";

/**
 * The Inngest developer agent function — wired with all providers.
 * Imported by `src/app/api/inngest/route.ts` to register with Inngest.
 */
export const developerAgentFunction = createDeveloperAgentFunction(
  aiProvider,
  aiConfig,
  sandboxProvider,
  databaseProvider,
  eventBus,
);

/** Re-export the Inngest client for use in the API route. */
export { inngestClient };
