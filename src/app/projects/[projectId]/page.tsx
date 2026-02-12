import { ProjectLayout } from "./_components/project-layout";
import { createTRPCContext } from "@/trpc/init";
import { createCallerFactory } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  // Server-side fetch for initial project name (avoids flash)
  let projectName = projectId;
  try {
    const ctx = await createTRPCContext();
    const caller = createCallerFactory(appRouter)(ctx);
    const project = await caller.projects.getOne({ id: projectId });
    projectName = project.name;
  } catch {
    // Fallback to ID if project not found; the client will handle errors
  }

  return <ProjectLayout projectId={projectId} initialProjectName={projectName} />;
}
