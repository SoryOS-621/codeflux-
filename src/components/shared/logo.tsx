/**
 * @file components/shared/logo.tsx
 * @description CodeFlux branding component with icon and text.
 */

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Show the text portion. Defaults to true. */
  showText?: boolean;
  className?: string;
}

export function Logo({ showText = true, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Zap className="h-4 w-4 text-primary-foreground" />
      </div>
      {showText && (
        <span className="text-lg font-bold tracking-tight">CodeFlux</span>
      )}
    </div>
  );
}
