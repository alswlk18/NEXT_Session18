"use client";

import Swatches from "./Swatches";
import Mockup from "./Mockup";
import CopyCss from "./CopyCss";

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

export default function DesignPanel({ tokens }: { tokens: DesignTokens | null }) {
  if (!tokens) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">
          앱 컨셉을 입력하면<br />
          디자인 방향, 색상, 폰트를<br />
          여기에서 볼 수 있어요
        </p>
      </div>
    );
  }

  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    tokens.typography.heading
  )}:wght@400;700&family=${encodeURIComponent(
    tokens.typography.body
  )}:wght@400;500&display=swap`;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* Google Fonts loader */}
      <link rel="stylesheet" href={googleFontsUrl} />

      {/* Mood badges */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          무드 키워드
        </h3>
        <div className="flex flex-wrap gap-2">
          {tokens.mood.map((m) => (
            <span
              key={m}
              className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tokens.colors.primary }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Typography sample */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          타이포그래피
        </h3>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p
            className="text-xl font-bold"
            style={{ fontFamily: tokens.typography.heading, color: tokens.colors.text }}
          >
            {tokens.typography.heading}
          </p>
          <p
            className="text-sm"
            style={{ fontFamily: tokens.typography.body, color: tokens.colors.textMuted }}
          >
            {tokens.typography.body} — 본문 텍스트 샘플
          </p>
        </div>
      </div>

      {/* Color swatches */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          컬러 팔레트
        </h3>
        <Swatches colors={tokens.colors} />
      </div>

      {/* Mockup */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          앱 미리보기
        </h3>
        <Mockup tokens={tokens} />
      </div>

      {/* CSS Export */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          CSS 내보내기
        </h3>
        <CopyCss tokens={tokens} />
      </div>
    </div>
  );
}
