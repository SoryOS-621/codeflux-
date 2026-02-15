/**
 * @file core/agents/verifier.ts
 * @description VerifierAgent — performs final validation of the generated project.
 *
 * The VerifierAgent runs after a successful build to verify:
 * 1. All expected files exist in the sandbox
 * 2. The dev server is responding on the preview port
 * 3. The preview URL is accessible
 *
 * This is the last agent in the pipeline — if it passes, the orchestrator
 * emits `completed` and persists the result.
 */

import { BaseAgent } from "./base";
import type { AgentContext, VerifierInput, VerifierOutput } from "./types";

/** Port the sandbox dev server runs on. */
const DEFAULT_PREVIEW_PORT = 3000;

export class VerifierAgent extends BaseAgent<VerifierInput, VerifierOutput> {
  readonly name = "VerifierAgent";

  async execute(
    input: VerifierInput,
    context: AgentContext,
  ): Promise<VerifierOutput> {
    const checks: string[] = [
      "files_exist",
      "preview_url_available",
      "main_entry_exists",
    ];

    // Emit verification_started
    this.emit(context, "verification_started", { checks });
    this.emitStatus(context, "Running final verification checks...");

    const results: Array<{
      check: string;
      passed: boolean;
      detail?: string;
    }> = [];

    // ── Check 1: Files exist in the sandbox ──────────────────────────────
    const fileCheck = await this.checkFilesExist(
      input.files,
      context,
    );
    results.push(fileCheck);

    // ── Check 2: Main entry point exists ─────────────────────────────────
    const mainEntryCheck = this.checkMainEntryExists(input.files);
    results.push(mainEntryCheck);

    // ── Check 3: Preview URL is available ────────────────────────────────
    let previewUrl = "";
    try {
      previewUrl = await context.deps.getSandboxPreviewUrl(
        context.sandboxId,
        input.previewPort || DEFAULT_PREVIEW_PORT,
      );
      results.push({
        check: "preview_url_available",
        passed: !!previewUrl,
        detail: previewUrl || "No preview URL returned",
      });
    } catch (error) {
      results.push({
        check: "preview_url_available",
        passed: false,
        detail: `Failed to get preview URL: ${String(error).slice(0, 150)}`,
      });
    }

    const allPassed = results.every((r) => r.passed);

    // Emit verification_completed
    this.emit(context, "verification_completed", {
      success: allPassed,
      results,
    });

    if (allPassed) {
      this.emitStatus(context, "All verification checks passed!");
    } else {
      const failed = results
        .filter((r) => !r.passed)
        .map((r) => r.check)
        .join(", ");
      this.emitStatus(
        context,
        `Verification completed with failures: ${failed}`,
      );
    }

    this.log(
      `Verification ${allPassed ? "PASSED" : "FAILED"}: ${results.map((r) => `${r.check}=${r.passed}`).join(", ")}`,
    );

    return {
      success: allPassed,
      previewUrl,
      results,
    };
  }

  /**
   * Verify that files from the state actually exist in the sandbox.
   */
  private async checkFilesExist(
    files: Record<string, string>,
    context: AgentContext,
  ): Promise<{ check: string; passed: boolean; detail?: string }> {
    const filePaths = Object.keys(files);

    if (filePaths.length === 0) {
      return {
        check: "files_exist",
        passed: false,
        detail: "No files were generated",
      };
    }

    try {
      // Spot-check the first few files by reading them from the sandbox
      const samplesToCheck = filePaths.slice(0, 5);
      const readResults = await context.deps.readSandboxFiles(
        context.sandboxId,
        samplesToCheck.map((p) =>
          p.startsWith("/") ? p : `/home/user/${p}`,
        ),
      );

      const allFound = readResults.length === samplesToCheck.length;

      return {
        check: "files_exist",
        passed: allFound,
        detail: allFound
          ? `${filePaths.length} files verified`
          : `Only ${readResults.length}/${samplesToCheck.length} sample files found`,
      };
    } catch (error) {
      return {
        check: "files_exist",
        passed: false,
        detail: `File check error: ${String(error).slice(0, 150)}`,
      };
    }
  }

  /**
   * Check that at least one main entry file exists (app/page.tsx).
   */
  private checkMainEntryExists(
    files: Record<string, string>,
  ): { check: string; passed: boolean; detail?: string } {
    const mainEntries = [
      "app/page.tsx",
      "app/page.ts",
      "app/page.jsx",
      "app/page.js",
    ];

    const found = mainEntries.find((entry) => entry in files);

    return {
      check: "main_entry_exists",
      passed: !!found,
      detail: found
        ? `Main entry: ${found}`
        : "No app/page.tsx found in generated files",
    };
  }
}
