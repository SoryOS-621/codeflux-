/**
 * @file app/dashboard/_components/empty-dashboard.tsx
 * @description Placeholder shown when the user has no projects yet.
 */

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { FolderOpen, Plus } from "lucide-react";

export function EmptyDashboard() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center py-32 px-4">
      <EmptyState
        icon={FolderOpen}
        title="No projects yet"
        description="Create your first project by describing what you want to build. The AI will generate the code for you."
        action={
          <Button onClick={() => router.push("/")} className="gap-1.5 mt-2">
            <Plus className="h-4 w-4" />
            Create Your First Project
          </Button>
        }
      />
    </div>
  );
}
