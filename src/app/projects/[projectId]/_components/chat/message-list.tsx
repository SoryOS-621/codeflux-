/**
 * @file _components/chat/message-list.tsx
 * @description Renders the list of chat messages (user + assistant).
 */

import { MessageBubble } from "./message-bubble";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Array<
    Message & {
      fragment?: {
        id: string;
        sandboxUrl: string;
        title: string;
        files: Record<string, string>;
      } | null;
    }
  >;
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">
          No messages yet. The AI will respond here.
        </p>
      </div>
    );
  }

  return (
    <>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </>
  );
}
