/**
 * @file app/dashboard/layout.tsx
 * @description Layout for the dashboard — global header + content area.
 */

import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
