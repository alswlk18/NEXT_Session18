"use client";

import { useState } from "react";
import Chat from "@/components/Chat";
import DesignPanel from "@/components/DesignPanel";

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

export default function Home() {
  const [tokens, setTokens] = useState<DesignTokens | null>(null);

  return (
    <main className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left: Chat */}
      <div className="flex flex-col w-full md:w-[52%] border-r border-gray-100 bg-white">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <h1 className="font-semibold text-gray-800 text-sm">디자인 방향 챗봇</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <Chat onTokens={(t) => setTokens(t as DesignTokens)} />
        </div>
      </div>

      {/* Right: Design Panel */}
      <div className="hidden md:flex flex-col w-[48%] bg-gray-50">
        <div className="px-5 py-4 border-b border-gray-100 bg-white">
          <h2 className="font-semibold text-gray-800 text-sm">디자인 미리보기</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <DesignPanel tokens={tokens} />
        </div>
      </div>
    </main>
  );
}
