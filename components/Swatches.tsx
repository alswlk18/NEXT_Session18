"use client";

interface Colors {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export default function Swatches({ colors }: { colors: Colors }) {
  const swatches = [
    { key: "primary", label: "Primary" },
    { key: "accent", label: "Accent" },
    { key: "background", label: "Background" },
    { key: "surface", label: "Surface" },
    { key: "text", label: "Text" },
    { key: "textMuted", label: "Text Muted" },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-2">
      {swatches.map(({ key, label }) => (
        <div key={key} className="flex flex-col gap-1">
          <div
            className="h-12 rounded-lg border border-black/10 shadow-sm"
            style={{ backgroundColor: colors[key] }}
          />
          <p className="text-xs font-medium text-gray-600">{label}</p>
          <p className="text-xs text-gray-400 font-mono">{colors[key]}</p>
        </div>
      ))}
    </div>
  );
}
