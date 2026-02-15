/**
 * @file app/api/projects/[projectId]/events/route.ts
 * @description Next.js Route Handler for SSE-streamed agent events.
 *
 * Endpoint: GET /api/projects/:projectId/events
 *
 * Returns a Server-Sent Events stream that:
 * - Replays all historical events for the project run (on reconnect)
 * - Streams new events in real-time as agents emit them
 * - Closes automatically when the orchestration finishes or errors
 *
 * The client can use `EventSource` or a `fetch()` reader to consume:
 * ```ts
 * const source = new EventSource(`/api/projects/${id}/events`);
 * source.addEventListener("files_written", (e) => { ... });
 * ```
 *
 * ## Headers
 * - `Content-Type: text/event-stream`
 * - `Cache-Control: no-cache, no-transform`
 * - `Connection: keep-alive`
 * - `X-Accel-Buffering: no` (disables nginx buffering)
 */

import { eventStreamProvider } from "@/infrastructure";

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]/events
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  if (!projectId || typeof projectId !== "string") {
    return new Response("Missing projectId", { status: 400 });
  }

  const stream = eventStreamProvider.createStream(projectId);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// Disable static generation for this route
export const dynamic = "force-dynamic";
