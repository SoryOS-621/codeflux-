/**
 * @file _components/preview/preview-iframe.tsx
 * @description Sandboxed iframe that loads the live preview URL.
 */

"use client";

interface PreviewIframeProps {
  url: string;
}

export function PreviewIframe({ url }: PreviewIframeProps) {
  return (
    <iframe
      src={url}
      title="Live Preview"
      className="h-full w-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      loading="lazy"
    />
  );
}
