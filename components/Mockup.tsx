"use client";

interface DesignTokens {
  mood: string[];
  rationale: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  typography: {
    heading: string;
    body: string;
  };
}

export default function Mockup({ tokens }: { tokens: DesignTokens }) {
  const { colors, typography } = tokens;

  return (
    <div
      className="rounded-2xl overflow-hidden border border-black/10 shadow-lg w-full max-w-xs mx-auto"
      style={{ backgroundColor: colors.background, fontFamily: typography.body }}
    >
      {/* App Bar */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: colors.primary }}
      >
        <span
          className="font-semibold text-sm"
          style={{
            fontFamily: typography.heading,
            color: colors.background,
          }}
        >
          MyApp
        </span>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: colors.background }} />
          <div className="w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: colors.background }} />
          <div className="w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: colors.background }} />
        </div>
      </div>

      {/* Hero Card */}
      <div className="p-4">
        <div
          className="rounded-xl p-5 mb-3"
          style={{ backgroundColor: colors.surface }}
        >
          <h2
            className="text-base font-bold mb-1"
            style={{ fontFamily: typography.heading, color: colors.text }}
          >
            {tokens.mood.join(" · ")}
          </h2>
          <p className="text-xs mb-4" style={{ color: colors.textMuted }}>
            {tokens.rationale.slice(0, 80)}
            {tokens.rationale.length > 80 ? "…" : ""}
          </p>
          <button
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: colors.primary, color: colors.background }}
          >
            시작하기
          </button>
        </div>

        {/* List Items */}
        {["첫 번째 항목", "두 번째 항목", "세 번째 항목"].map((item, i) => (
          <div
            key={i}
            className="rounded-xl p-3 mb-2 flex items-center gap-3"
            style={{ backgroundColor: colors.surface }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: colors.accent, color: colors.background }}
            >
              {i + 1}
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: colors.text }}>
                {item}
              </p>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                설명 텍스트
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Tab Bar */}
      <div
        className="flex justify-around items-center py-3 px-4 border-t"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.textMuted + "30",
        }}
      >
        {["홈", "탐색", "설정"].map((tab, i) => (
          <div key={tab} className="flex flex-col items-center gap-1">
            <div
              className="w-5 h-5 rounded"
              style={{
                backgroundColor: i === 0 ? colors.primary : colors.textMuted,
                opacity: i === 0 ? 1 : 0.4,
              }}
            />
            <span
              className="text-xs"
              style={{
                color: i === 0 ? colors.primary : colors.textMuted,
                fontFamily: typography.body,
              }}
            >
              {tab}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
