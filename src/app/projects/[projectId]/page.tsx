/**
 * @file page.tsx  (Project detail page — route: `/projects/[projectId]`)
 * @description Displays the details and AI-generated results for a specific project.
 *
 * This is a Server Component that extracts the `projectId` from the URL
 * params and will eventually render the chat history, live sandbox preview,
 * and generated code fragments.
 */

/** Props for the project detail page (Next.js App Router dynamic route). */
interface ProjectDetailPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

const ProjectDetailPage = async ({ params }: ProjectDetailPageProps) => {
  const { projectId } = await params;

  return (
    <div>
      ProjectId : {projectId}
    </div>
  );
};

export default ProjectDetailPage;
