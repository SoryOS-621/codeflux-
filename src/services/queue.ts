/**
 * @file services/queue.ts
 * @description Interface for background job queue providers.
 *
 * Any queue system (Inngest, AWS SQS, BullMQ, etc.) must implement this
 * interface. Module routers use this to enqueue work — they never import
 * a specific queue library directly.
 */

import type { JobPayload } from "@/types";

/**
 * Contract that every queue provider must satisfy.
 *
 * The queue provider is responsible for:
 * 1. Accepting job payloads and enqueuing them reliably
 * 2. Ensuring at-least-once delivery
 * 3. Invoking the registered handler when a job is picked up
 */
export interface QueueProvider {
  /**
   * Enqueue a background job.
   *
   * @param job - The job payload containing event name and data.
   */
  enqueue(job: JobPayload): Promise<void>;
}
