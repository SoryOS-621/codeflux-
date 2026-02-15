/**
 * @file components/shared/code-block.tsx
 * @description Syntax-highlighted code display with copy-to-clipboard button.
 *
 * Uses Shiki for accurate syntax highlighting with theme support.
 * Falls back to plain <pre> if highlighting fails.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  /** The raw code string to display. */
  code: string;
  /** Language for syntax highlighting (e.g. "tsx", "css", "json"). */
  language?: string;
  /** File name displayed in the header. */
  fileName?: string;
  /** Max height before scrolling. */
  maxHeight?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = "tsx",
  fileName,
  maxHeight = "500px",
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  // Dynamically import and run Shiki to avoid SSR issues
  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const { codeToHtml } = await import("shiki");
        const html = await codeToHtml(code, {
          lang: language,
          theme: "github-dark",
        });
        if (!cancelled) setHighlightedHtml(html);
      } catch {
        // Shiki failed (unsupported language, etc.) — fallback to plain text
        if (!cancelled) setHighlightedHtml(null);
      }
    }

    highlight();
    return () => { cancelled = true; };
  }, [code, language]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className={cn("rounded-lg border bg-muted/50 overflow-hidden", className)}>
      {/* Header bar */}
      {fileName && (
        <div className="flex items-center justify-between border-b px-3 py-1.5 bg-muted/80">
          <span className="text-xs font-mono text-muted-foreground truncate">
            {fileName}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      )}

      {/* Code content */}
      <div
        className="overflow-auto text-sm"
        style={{ maxHeight }}
      >
        {highlightedHtml ? (
          <div
            className="[&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:m-0"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <pre className="p-4 font-mono text-sm whitespace-pre-wrap text-foreground">
            {code}
          </pre>
        )}
      </div>
    </div>
  );
}
