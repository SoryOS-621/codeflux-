/**
 * @file core/orchestrator/retry-controller.ts
 * @description Retry controller for the build → debug → rebuild cycle.
 *
 * Manages retry state, enforces maximum attempts, and emits retry-related
 * events so the user sees each attempt in real-time.
 */

import type { EventBus } from "@/core/events/event-bus";

/** Default maximum retry attempts. */
const DEFAULT_MAX_ATTEMPTS = 5;

/**
 * Controls the retry loop for build failures.
 *
 * Usage:
 * ```ts
 * const retry = new RetryController(eventBus, projectId, 5);
 * while (retry.canRetry()) {
 *   retry.recordAttempt(errorMessage);
 *   // ... run debugger + rebuild ...
 * }
 * ```
 */
export class RetryController {
  private attempt = 0;
  private readonly maxAttempts: number;
  private readonly eventBus: EventBus;
  private readonly projectId: string;

  constructor(
    eventBus: EventBus,
    projectId: string,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
  ) {
    this.eventBus = eventBus;
    this.projectId = projectId;
    this.maxAttempts = maxAttempts;
  }

  /**
   * Whether another retry attempt is allowed.
   */
  canRetry(): boolean {
    return this.attempt < this.maxAttempts;
  }

  /**
   * Record a failed attempt and emit a `retrying` event.
   *
   * @param reason - Why the retry is happening (usually the build error).
   * @returns The current attempt number (1-indexed).
   */
  recordAttempt(reason: string): number {
    this.attempt++;

    this.eventBus.emit("retrying", "RetryController", this.projectId, {
      attempt: this.attempt,
      maxAttempts: this.maxAttempts,
      reason: reason.slice(0, 500),
    });

    console.log(
      `[RetryController] Attempt ${this.attempt}/${this.maxAttempts} for project ${this.projectId}`,
    );

    return this.attempt;
  }

  /**
   * Get the current attempt number.
   */
  getAttempt(): number {
    return this.attempt;
  }

  /**
   * Get the maximum number of attempts.
   */
  getMaxAttempts(): number {
    return this.maxAttempts;
  }

  /**
   * Whether all retries have been exhausted.
   */
  isExhausted(): boolean {
    return this.attempt >= this.maxAttempts;
  }
}
