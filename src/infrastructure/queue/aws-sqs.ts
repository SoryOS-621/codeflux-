/**
 * @file infrastructure/queue/aws-sqs.ts
 * @description AWS SQS implementation of the QueueProvider interface.
 *
 * STUB — this file provides the structure for using AWS SQS as the
 * background job queue. Replace the TODO implementation when switching
 * from Inngest to AWS SQS.
 */

import type { QueueProvider } from "@/services/queue";
import type { JobPayload } from "@/types";

/**
 * Queue provider backed by AWS SQS.
 *
 * To use this provider, update the central wiring in
 * `src/infrastructure/index.ts` to instantiate `AWSSQSQueueProvider`
 * instead of `InngestQueueProvider`.
 *
 * You'll also need to set up an SQS consumer (e.g. Lambda or ECS worker)
 * that dequeues messages and calls `generateProject()` from core.
 */
export class AWSSQSQueueProvider implements QueueProvider {
  async enqueue(_job: JobPayload): Promise<void> {
    // TODO: Implement using AWS SDK
    // import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
    // const client = new SQSClient({ region: process.env.AWS_REGION });
    // await client.send(new SendMessageCommand({
    //   QueueUrl: process.env.SQS_QUEUE_URL,
    //   MessageBody: JSON.stringify(job),
    // }));
    throw new Error("AWSSQSQueueProvider.enqueue() not implemented yet");
  }
}
