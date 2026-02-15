/**
 * @file sandbox-helpers.ts
 * @description Utility functions for interacting with E2B cloud sandboxes
 * and parsing AI agent responses.
 *
 * These helpers are used exclusively by the developer agent
 * (see `developer-agent.ts`).
 */

import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";

/**
 * Reconnects to an existing E2B sandbox by its ID.
 *
 * E2B sandboxes persist between steps, so we reconnect (rather than
 * create a new one) each time a tool handler runs in a different
 * Inngest step.
 *
 * @param sandboxId - The unique ID returned by `Sandbox.create()`.
 * @returns The reconnected Sandbox instance.
 */
export async function connectToSandbox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
  return sandbox;
}

/**
 * Extracts the text content from the last assistant message in an
 * agent result's output array.
 *
 * The agent loop may produce multiple messages per iteration; we only
 * care about the final assistant reply (which should contain the
 * `<task_summary>` tag when the agent considers itself done).
 *
 * @param result - The `AgentResult` returned by a single agent iteration.
 * @returns The assistant's text content, or `undefined` if not found.
 */
export function extractLastAssistantMessage(result: AgentResult) {
  const lastAssistantIndex = result.output.findLastIndex(
    (message) => message.role === "assistant",
  );

  const message = result.output[lastAssistantIndex] as
    | TextMessage
    | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((c) => c.text).join("")
    : undefined;
}
