/**
 * @file core/agent/helpers.ts
 * @description Pure utility functions used by the agent orchestration logic.
 *
 * These are stateless, side-effect-free helpers — no external dependencies.
 */

// ---------------------------------------------------------------------------
// Shell Command Sanitization
// ---------------------------------------------------------------------------

/**
 * Rewrites directory-listing shell commands (ls, find, tree, du) so that
 * `node_modules` is always excluded at the shell level.
 *
 * Without this, the AI agent might run `ls` or `tree` on the project root
 * and receive hundreds of thousands of lines of output from node_modules,
 * which wastes tokens and confuses the model.
 *
 * @param rawCommand - The original shell command string from the agent.
 * @returns The rewritten command with node_modules excluded.
 */
export function sanitizeShellCommand(rawCommand: string): string {
  const segments = rawCommand.split("|");

  const rewritten = segments.map((seg) => {
    const trimmed = seg.trim();

    // ls — use --ignore flag so node_modules is never listed
    if (/^ls\b/.test(trimmed)) {
      if (!trimmed.includes("--ignore") || !trimmed.includes("node_modules")) {
        return ` ${trimmed} --ignore='node_modules'`;
      }
    }

    // find — use -prune so the directory is never descended into
    if (/^find\b/.test(trimmed) && !trimmed.includes("node_modules")) {
      const tokens = trimmed.split(/\s+/);
      const findCmd = tokens[0]; // "find"
      const findPath = tokens[1] || ".";
      const rest = tokens.slice(2).join(" ");
      return ` ${findCmd} ${findPath} -name 'node_modules' -prune -o ${rest || "-print"} ${rest ? "" : ""}`.replace(
        /\s+$/,
        "",
      );
    }

    // tree — use -I so node_modules is never traversed
    if (/^tree\b/.test(trimmed) && !trimmed.includes("node_modules")) {
      return ` ${trimmed} -I 'node_modules'`;
    }

    // du — use --exclude so node_modules is skipped entirely
    if (/^du\b/.test(trimmed) && !trimmed.includes("node_modules")) {
      return ` ${trimmed} --exclude='node_modules'`;
    }

    return seg;
  });

  return rewritten.join("|");
}

// ---------------------------------------------------------------------------
// Error Classification
// ---------------------------------------------------------------------------

/**
 * Classifies an upstream AI error into a user-friendly message.
 *
 * @param error - The raw error (string or Error object).
 * @returns A user-friendly error message.
 */
export function classifyAIError(error: unknown): string {
  const errorString = String(error);

  if (
    errorString.includes("Failed to parse JSON") ||
    errorString.includes("Expected ','")
  ) {
    return "⚠️ AI model returned broken JSON. Free model likely crashed mid-response. Retry or switch model.";
  }

  if (
    errorString.includes("401") ||
    errorString.includes("403") ||
    errorString.includes("Unauthorized")
  ) {
    return "⚠️ API key rejected. Check OPENROUTER_API_KEY in .env (no trailing spaces).";
  }

  if (
    errorString.includes("429") ||
    errorString.includes("rate limit")
  ) {
    return "⚠️ Rate limited. Wait a minute and retry.";
  }

  if (
    errorString.includes("502") ||
    errorString.includes("503") ||
    errorString.includes("timeout")
  ) {
    return "⚠️ AI provider down/timed out. Retry later or switch model.";
  }

  return `⚠️ Upstream AI error: ${errorString.slice(0, 150)}`;
}

// ---------------------------------------------------------------------------
// Result Validation
// ---------------------------------------------------------------------------

/**
 * Determines whether an agent result is incomplete.
 *
 * @param summary - The agent's task summary (empty string if not set).
 * @param files   - The map of generated files.
 * @returns True if the result is incomplete.
 */
export function isIncompleteResult(
  summary: string,
  files: Record<string, string>,
): boolean {
  return !summary || Object.keys(files).length === 0;
}

/**
 * Generates a detailed explanation of why a result is incomplete.
 *
 * @param summary - The agent's task summary.
 * @param files   - The map of generated files.
 * @param iterationCount - How many iterations the agent ran.
 * @returns A user-facing explanation string.
 */
export function getIncompleteResultMessage(
  summary: string,
  files: Record<string, string>,
  iterationCount: number,
): string {
  const hasSummary = !!summary;
  const hasFiles = Object.keys(files).length > 0;

  const detail =
    !hasSummary && !hasFiles
      ? "No summary and no files were generated."
      : !hasSummary
        ? "Files were created but the model never produced a <task_summary>."
        : "Summary exists but no files were written to the sandbox.";

  return (
    `⚠️ Agent ran ${iterationCount} iteration(s) but result is incomplete. ` +
    `${detail} This usually means the model ran out of tokens, got stuck in a loop, ` +
    `or the prompt was too complex. Try a shorter/simpler prompt or switch to a stronger model.`
  );
}
