/**
 * @file app/projects/[projectId]/layout.tsx
 * @description Layout for the project workspace — full-bleed, no header padding.
 *
 * The workspace has its own header embedded in the page, so this
 * layout is minimal.
 */

export default function ProjectLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="h-screen w-screen overflow-hidden">{children}</div>;
}
