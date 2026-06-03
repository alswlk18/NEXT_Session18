import { openai, EMBEDDING_MODEL } from "./openai";
import { KNOWLEDGE_DOCS } from "./knowledge";

interface KBEntry {
  content: string;
  embedding: number[] | null;
}

let kb: KBEntry[] | null = null;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

async function loadKB(): Promise<KBEntry[]> {
  if (kb) return kb;

  const entries: KBEntry[] = KNOWLEDGE_DOCS.map((content) => ({ content, embedding: null }));

  const embRes = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: entries.map((e) => e.content),
  });

  embRes.data.forEach((d, i) => {
    entries[i].embedding = d.embedding;
  });

  kb = entries;
  return kb;
}

export async function retrieveContext(query: string, topK = 2): Promise<string> {
  try {
    const entries = await loadKB();

    const qRes = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: [query],
    });
    if (!qRes.data?.length) return "";
    const qEmb = qRes.data[0].embedding;

    const scored = entries
      .filter((e) => e.embedding !== null)
      .map((e) => ({
        content: e.content,
        score: cosineSimilarity(qEmb, e.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map((s) => s.content.slice(0, 400)).join("\n---\n");
  } catch (err) {
    console.error("RAG error:", err);
    return "";
  }
}
