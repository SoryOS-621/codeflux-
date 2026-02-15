/**
 * @file components/shared/markdown-renderer.tsx
 * @description Renders markdown content with syntax-highlighted code blocks.
 *
 * Used for rendering AI assistant messages in the chat panel.
 */

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content: markdownContent, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Style code blocks
          pre({ children, ...props }) {
            return (
              <pre
                className="overflow-x-auto rounded-lg bg-muted p-3 text-sm"
                {...props}
              >
                {children}
              </pre>
            );
          },
          // Style inline code
          code({ children, className: codeClassName, ...props }) {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("text-sm font-mono", codeClassName)} {...props}>
                {children}
              </code>
            );
          },
          // Style links
          a({ children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
}
