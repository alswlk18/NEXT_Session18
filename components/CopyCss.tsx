"use client";

import { useState } from "react";

interface DesignTokens {
  colors: Record<string, string>;
  typography: { heading: string; body: string };
}

export default function CopyCss({ tokens }: { tokens: DesignTokens }) {
  const [copied, setCopied] = useState(false);

  const css = `:root {
${Object.entries(tokens.colors)
  .map(
    ([k, v]) =>
      `  --color-${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v};`
  )
  .join("\n")}
  --font-heading: '${tokens.typography.heading}', serif;
  --font-body: '${tokens.typography.body}', sans-serif;
}`;

  const copy = async () => {
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <pre className="text-xs bg-gray-900 text-green-400 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">
        {css}
      </pre>
      <button
        onClick={copy}
        className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          backgroundColor: copied ? "#22c55e" : "#1f2937",
          color: "#fff",
        }}
      >
        {copied ? "복사됨!" : "CSS 변수 복사"}
      </button>
    </div>
  );
}
