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
 * Returns the real error string — no hardcoded classifications.
 *
 * @param error - The raw error (string or Error object).
 * @returns The actual error message.
 */
export function classifyAIError(error: unknown): string {
  if (error instanceof Error) {
    return `⚠️ ${error.name}: ${error.message}\n${error.stack ?? ""}`;
  }
  return `⚠️ ${String(error)}`;
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
    `⚠️ Agent ran ${iterationCount} iteration(s) but result is incomplete. ${detail}`
  );
}
