import OpenAI from "openai";

let _openai: OpenAI | null = null;

// 현행 모델은 OpenAI 문서 확인: https://platform.openai.com/docs/models
export const CHAT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";
export const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Named export kept for backward compat — lazily initialized via Proxy
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
