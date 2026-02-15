/**
 * @file page.tsx  (Project detail page — route: `/projects/[projectId]`)
 * @description The main workspace page for a project.
 *
 * This is a Server Component that extracts `projectId` from the URL params
 * and renders the client-side Workspace component which orchestrates all panels.
 */

import { Workspace } from "./_components/workspace";

/** Props for the project detail page (Next.js App Router dynamic route). */
interface ProjectDetailPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

const ProjectDetailPage = async ({ params }: ProjectDetailPageProps) => {
  const { projectId } = await params;

  return <Workspace projectId={projectId} />;
};

export default ProjectDetailPage;
