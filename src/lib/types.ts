/** Shared type definitions for the application */

/** Re-export Prisma-generated enums for convenience */
export type { MessageRole, MessageType } from "@/generated/client/enums";

/** Shape of a fragment as stored in DB */
export interface FragmentData {
  id: string;
  messageId: string;
  sandboxUrl: string;
  title: string;
  files: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

/** Shape of a message with its optional fragment */
export interface MessageWithFragment {
  id: string;
  content: string;
  role: "USER" | "ASSISTANT";
  type: "RESULT" | "ERROR";
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  fragment: FragmentData | null;
}

/** Shape of a project from getMany (includes message count) */
export interface ProjectWithCount {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    messages: number;
  };
}

/** File entry for the code viewer */
export interface FileEntry {
  path: string;
  content: string;
}
