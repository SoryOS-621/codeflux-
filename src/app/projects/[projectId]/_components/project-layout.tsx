"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import { ChatPanel } from "./chat-panel";
import { PreviewPanel } from "./preview-panel";
import { CodePanel } from "./code-panel";
import { useTRPC } from "@/trpc/client";
import { MESSAGE_POLL_INTERVAL } from "@/lib/constants";
import type { MessageWithFragment } from "@/lib/types";

interface ProjectLayoutProps {
  projectId: string;
  initialProjectName: string;
}

export function ProjectLayout({ projectId, initialProjectName }: ProjectLayoutProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [activeRightTab, setActiveRightTab] = useState<string>("preview");

  // Fetch project data
  const projectQuery = useQuery(
    trpc.projects.getOne.queryOptions({ id: projectId })
  );

  // Fetch messages with polling
  const messagesQuery = useQuery({
    ...trpc.messages.getMany.queryOptions({ projectId }),
    refetchInterval: MESSAGE_POLL_INTERVAL,
  });

  const messages = useMemo(
    () => (messagesQuery.data ?? []) as MessageWithFragment[],
    [messagesQuery.data]
  );

  // Determine if the agent is still working:
  //  - There's at least one USER message
  //  - The last message is from USER (agent hasn't responded yet)
  const isAgentWorking = useMemo(() => {
    if (messages.length === 0) return false;
    const lastMessage = messages[messages.length - 1];
    return lastMessage.role === "USER";
  }, [messages]);

  // Get the latest fragment for preview
  const latestFragment = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].fragment) {
        return messages[i].fragment;
      }
    }
    return null;
  }, [messages]);

  // Active sandbox URL and files
  const [viewingFragment, setViewingFragment] = useState<MessageWithFragment | null>(null);

  const activeSandboxUrl = viewingFragment?.fragment?.sandboxUrl ?? latestFragment?.sandboxUrl ?? null;
  const activeFiles = useMemo(() => {
    const frag = viewingFragment?.fragment ?? latestFragment;
    if (!frag?.files) return {};
    // files is stored as JSON, could be string or object
    if (typeof frag.files === "string") {
      try {
        return JSON.parse(frag.files) as Record<string, string>;
      } catch {
        return {};
      }
    }
    return frag.files as Record<string, string>;
  }, [viewingFragment, latestFragment]);

  // Send message mutation
  const sendMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        // Immediately refetch to show the new user message
        queryClient.invalidateQueries({ queryKey: trpc.messages.getMany.queryKey({ projectId }) });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      sendMessage.mutate({ value: content, projectId });
    },
    [sendMessage, projectId]
  );

  const handleViewFragment = useCallback(
    (message: MessageWithFragment) => {
      setViewingFragment(message);
      setActiveRightTab("preview");
    },
    []
  );

  const projectName = projectQuery.data?.name ?? initialProjectName;

  return (
    <div className="h-screen flex flex-col">
      <Navbar projectName={projectName} />

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left: Chat Panel */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <ChatPanel
              messages={messages}
              isLoading={messagesQuery.isLoading}
              isSending={sendMessage.isPending}
              isAgentWorking={isAgentWorking}
              onSendMessage={handleSendMessage}
              onViewFragment={handleViewFragment}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Preview + Code Tabs */}
          <ResizablePanel defaultSize={70} minSize={40}>
            <Tabs
              value={activeRightTab}
              onValueChange={setActiveRightTab}
              className="h-full flex flex-col"
            >
              <div className="border-b border-border px-3 shrink-0">
                <TabsList className="h-9 bg-transparent p-0 gap-0">
                  <TabsTrigger
                    value="preview"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 text-xs"
                  >
                    Preview
                  </TabsTrigger>
                  <TabsTrigger
                    value="code"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 text-xs"
                  >
                    Code
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="preview" className="flex-1 mt-0 min-h-0">
                <PreviewPanel sandboxUrl={activeSandboxUrl} />
              </TabsContent>

              <TabsContent value="code" className="flex-1 mt-0 min-h-0">
                <CodePanel files={activeFiles} />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
