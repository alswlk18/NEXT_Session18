import OpenAI from "openai";

// 현행 모델은 OpenAI 문서 확인: https://platform.openai.com/docs/models
export const CHAT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
export const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

// Custom fetch that encodes string bodies as UTF-8 Uint8Array,
// preventing the Vercel/Node ByteString error with non-ASCII characters.
const utf8Fetch: typeof fetch = async (input, init) => {
  if (init?.body && typeof init.body === "string") {
    const encoded = new TextEncoder().encode(init.body);
    return fetch(input, { ...init, body: encoded });
  }
  return fetch(input, init);
};

let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      fetch: utf8Fetch,
    });
  }
  return _openai;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
