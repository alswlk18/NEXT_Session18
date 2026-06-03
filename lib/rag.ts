import { KNOWLEDGE_DOCS } from "./knowledge";

// Keyword-based matching — no embedding API call, Vercel-safe
export function retrieveContext(query: string, topK = 2): string {
  const queryTerms = query
    .toLowerCase()
    .split(/[\s,./!?]+/)
    .filter((w) => w.length > 1);

  const scored = KNOWLEDGE_DOCS.map((doc) => {
    const docLower = doc.toLowerCase();
    const score = queryTerms.filter((term) => docLower.includes(term)).length;
    return { content: doc, score };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map((s) => s.content.slice(0, 400)).join("\n---\n");
}
