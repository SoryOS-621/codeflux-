"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavbarProps {
  /** Optional project name shown when inside a project */
  projectName?: string;
}

export function Navbar({ projectName }: NavbarProps) {
  const pathname = usePathname();
  const isProjectPage = pathname.startsWith("/projects/");

  return (
    <header className="h-12 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 shrink-0 z-50">
      <div className="flex items-center gap-3 w-full">
        {/* Back button on project pages */}
        {isProjectPage && (
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
        )}

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Zap className="size-4 text-primary" />
          </div>
          <span className={cn(
            "font-semibold text-sm tracking-tight",
            isProjectPage && "hidden sm:inline"
          )}>
            {APP_NAME}
          </span>
        </Link>

        {/* Project name breadcrumb */}
        {isProjectPage && projectName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <span className="text-border">/</span>
            <span className="truncate max-w-[200px]">{projectName}</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />
      </div>
    </header>
  );
}
