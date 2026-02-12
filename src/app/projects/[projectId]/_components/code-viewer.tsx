"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

interface CodeViewerProps {
  code: string;
  filePath: string;
}

/** Returns the language label based on file extension */
function getLanguageLabel(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TSX",
    js: "JavaScript",
    jsx: "JSX",
    css: "CSS",
    json: "JSON",
    html: "HTML",
    md: "Markdown",
    txt: "Text",
    sh: "Shell",
    yaml: "YAML",
    yml: "YAML",
    toml: "TOML",
    env: "Environment",
  };
  return map[ext] ?? ext.toUpperCase();
}

export function CodeViewer({ code, filePath }: CodeViewerProps) {
  const lines = code.split("\n");
  const language = getLanguageLabel(filePath);

  return (
    <div className="flex flex-col h-full">
      {/* File info bar */}
      <div className="h-8 border-b border-border flex items-center justify-between px-3 shrink-0 bg-accent/30">
        <span className="text-xs text-foreground font-mono truncate">{filePath}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0 ml-2">
          {language}
        </span>
      </div>

      {/* Code content */}
      <ScrollArea className="flex-1">
        <div className="py-2 overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-accent/30 transition-colors">
                  <td className="text-right pr-4 pl-4 py-0 select-none text-[11px] text-muted-foreground/40 font-mono w-12 align-top">
                    {i + 1}
                  </td>
                  <td className="py-0 pr-4">
                    <pre className="text-xs font-mono text-foreground/90 whitespace-pre">
                      {line || " "}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}
