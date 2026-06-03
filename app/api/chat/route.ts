import { NextRequest } from "next/server";
import https from "node:https";
import { retrieveContext } from "@/lib/rag";
import { generatePalette } from "@/lib/tools/generatePalette";
import { webSearchTrends } from "@/lib/tools/webSearchTrends";

export const runtime = "nodejs";
export const maxDuration = 60;

// Direct HTTPS call — bypasses SDK fetch entirely, guarantees UTF-8 encoding
function openAIPost(body: object): Promise<{
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason: string;
  }>;
}> {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(JSON.stringify(body), "utf8");
    const req = https.request(
      {
        hostname: "api.openai.com",
        port: 443,
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
          Authorization: `Bearer ${(process.env.OPENAI_API_KEY ?? "").trim()}`,
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": buf.length,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            if (json.error) reject(new Error(json.error.message));
            else resolve(json);
          } catch (e) {
            reject(e);
          }
        });
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.write(buf);
    req.end();
  });
}

const CHAT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_palette",
      description: "Generates a color palette. MUST be used for all color generation — never write hex values yourself.",
      parameters: {
        type: "object",
        properties: {
          base_hex: { type: "string", description: "Base hex color e.g. #4A6FA5" },
          mood: { type: "string", description: "Mood e.g. calm, premium, energetic" },
        },
        required: ["base_hex", "mood"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search_trends",
      description: "Search latest UI/UX design trends. Use when user asks about trends.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
];

const SYSTEM_PROMPT = (ragContext: string, trendContext: string) =>
  `You are a design direction advisor. Respond in the same language as the user.

RULES:
1. NEVER write hex colors yourself — always call generate_palette tool first.
2. Every response (including follow-ups: darker, lighter, change, etc.) MUST call generate_palette and end with a tokens block.
3. Colors in tokens block MUST be exact values from generate_palette result.
${trendContext ? "4. Trend data is provided below — cite 2-3 URLs as references." : ""}

End every response with:
\`\`\`tokens
{
  "mood": ["keyword1", "keyword2"],
  "rationale": "why this mood fits",
  "colors": {
    "primary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "surface": "#hex",
    "text": "#hex",
    "textMuted": "#hex"
  },
  "typography": { "heading": "FontName", "body": "FontName" }
}
\`\`\`

KNOWLEDGE:
${ragContext}${trendContext ? `\n\nTREND DATA:\n${trendContext.slice(0, 1000)}` : ""}`;

const TREND_KEYWORDS = ["trend", "trendy", "modern", "latest", "트렌드", "최신", "요즘", "현재", "레퍼런스"];
const MAX_ITERATIONS = 5;

type Msg = { role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string };

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
  }

  const { messages } = await req.json();
  const lastUserMsg: string =
    messages.filter((m: { role: string }) => m.role === "user").at(-1)?.content ?? "";

  const hasTrend = TREND_KEYWORDS.some((k) => lastUserMsg.toLowerCase().includes(k));

  const ragContext = retrieveContext(lastUserMsg);
  const trendContext = hasTrend
    ? await webSearchTrends(`${lastUserMsg} UI UX design trends 2025`)
    : "";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) =>
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));

      try {
        const msgs: Msg[] = [
          { role: "system", content: SYSTEM_PROMPT(ragContext, trendContext) },
          ...messages.slice(-6),
        ];

        let iterations = 0;
        while (iterations < MAX_ITERATIONS) {
          iterations++;

          const response = await openAIPost({
            model: CHAT_MODEL,
            messages: msgs,
            tools: TOOLS,
            tool_choice: "auto",
            max_tokens: 700,
          });

          const choice = response.choices[0];

          if (choice.finish_reason === "tool_calls") {
            const toolCalls = choice.message.tool_calls ?? [];
            msgs.push(choice.message as Msg);

            for (const tc of toolCalls) {
              if (tc.type !== "function") continue;
              let args: Record<string, string>;
              try {
                args = JSON.parse(tc.function.arguments);
              } catch {
                continue;
              }

              let result = "";
              if (tc.function.name === "generate_palette" && args.base_hex && args.mood) {
                const palette = generatePalette(args as { base_hex: string; mood: string });
                result = JSON.stringify(palette);
                send(JSON.stringify({ type: "tool", name: "generate_palette", result: palette }));
              } else if (tc.function.name === "web_search_trends" && args.query) {
                result = await webSearchTrends(args.query);
                send(JSON.stringify({ type: "tool", name: "web_search_trends" }));
              }

              msgs.push({ role: "tool", tool_call_id: tc.id, content: result });
            }
            continue;
          }

          const finalContent = choice.message.content ?? "";
          send(JSON.stringify({ type: "delta", content: finalContent }));
          send(JSON.stringify({ type: "done" }));
          break;
        }
      } catch (err) {
        console.error("Chat error:", err);
        send(JSON.stringify({ type: "error", message: String(err) }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
