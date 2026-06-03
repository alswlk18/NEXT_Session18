import { NextRequest } from "next/server";
import { openai, CHAT_MODEL } from "@/lib/openai";
import { retrieveContext } from "@/lib/rag";
import { generatePalette } from "@/lib/tools/generatePalette";
import { webSearchTrends } from "@/lib/tools/webSearchTrends";

export const runtime = "nodejs";
export const maxDuration = 60;

const TOOLS: Parameters<typeof openai.chat.completions.create>[0]["tools"] = [
  {
    type: "function",
    function: {
      name: "generate_palette",
      description:
        "Generates a harmonious color palette from a base hex color and mood. MUST be used for all color generation — do not guess hex values.",
      parameters: {
        type: "object",
        properties: {
          base_hex: { type: "string", description: "Base hex color (e.g. #4A6FA5)" },
          mood: { type: "string", description: "Mood descriptor (e.g. calm, premium, energetic)" },
        },
        required: ["base_hex", "mood"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search_trends",
      description: "Search for latest UI/UX design trends. Use when user asks about trends.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query about UI/UX trends" },
        },
        required: ["query"],
      },
    },
  },
];

const SYSTEM_PROMPT = (ragContext: string, trendContext = "") =>
  `You are a design direction advisor. Respond in the same language as the user (Korean or English).

STRICT RULES:
1. NEVER write hex color values yourself. Always call generate_palette to get colors.
2. EVERY response — first request AND follow-ups (더 어둡게, 더 밝게, 바꿔줘, 트렌드 반영 etc.) — MUST call generate_palette and end with a \`\`\`tokens block.
3. The colors in the tokens block MUST be the exact values returned by generate_palette.
4. If trend data below contains URLs, list 2-3 as "참고 링크".

You MUST end every response with this exact block (filled with real values):
\`\`\`tokens
{
  "mood": ["키워드1", "키워드2"],
  "rationale": "이 무드가 맞는 이유 한두 줄",
  "colors": {
    "primary": "#xxxxxx",
    "accent": "#xxxxxx",
    "background": "#xxxxxx",
    "surface": "#xxxxxx",
    "text": "#xxxxxx",
    "textMuted": "#xxxxxx"
  },
  "typography": {
    "heading": "FontName",
    "body": "FontName"
  }
}
\`\`\`

KNOWLEDGE BASE:
${ragContext}${
    trendContext &&
    !trendContext.startsWith("[SEARCH_FAILED") &&
    !trendContext.startsWith("[NO_KEY")
      ? `\n\nTREND DATA (cite URLs in your response):\n${trendContext.slice(0, 1200)}`
      : ""
  }`;

const TREND_KEYWORDS = ["트렌드", "최신", "trend", "modern", "trendy", "요즘", "현재", "레퍼런스"];
const MAX_TOOL_ITERATIONS = 5;

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
  }

  const { messages } = await req.json();

  const lastUserMsg =
    messages.filter((m: { role: string }) => m.role === "user").at(-1)?.content ?? "";

  const hasTrendRequest = TREND_KEYWORDS.some((k) =>
    lastUserMsg.toLowerCase().includes(k)
  );

  const [ragContext, trendContext] = await Promise.all([
    retrieveContext(lastUserMsg),
    hasTrendRequest
      ? webSearchTrends(`${lastUserMsg} app UI UX design trends 2024 2025`)
      : Promise.resolve(""),
  ]);

  if (hasTrendRequest) {
    console.log("Trend search result preview:", trendContext.slice(0, 120));
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        let msgs: Parameters<typeof openai.chat.completions.create>[0]["messages"] = [
          { role: "system", content: SYSTEM_PROMPT(ragContext, trendContext) },
          ...messages.slice(-6),
        ];

        let iterations = 0;

        while (iterations < MAX_TOOL_ITERATIONS) {
          iterations++;

          const response = await openai.chat.completions.create({
            model: CHAT_MODEL,
            messages: msgs,
            tools: TOOLS,
            tool_choice: "auto",
            stream: false,
            max_tokens: 700,
          });

          const choice = response.choices[0];

          if (choice.finish_reason === "tool_calls") {
            const toolCalls = choice.message.tool_calls ?? [];
            msgs.push(choice.message);

            for (const tc of toolCalls) {
              if (tc.type !== "function") continue;
              const fn = tc.function;

              let args: Record<string, string>;
              try {
                args = JSON.parse(fn.arguments);
              } catch {
                console.error(`Failed to parse args for ${fn.name}`);
                continue;
              }

              let result = "";

              if (fn.name === "generate_palette" && args.base_hex && args.mood) {
                const palette = generatePalette(args as { base_hex: string; mood: string });
                result = JSON.stringify(palette);
                send(JSON.stringify({ type: "tool", name: "generate_palette", result: palette }));
              } else if (fn.name === "web_search_trends" && args.query) {
                result = await webSearchTrends(args.query);
                send(JSON.stringify({ type: "tool", name: "web_search_trends" }));
              }

              msgs.push({ role: "tool", tool_call_id: tc.id, content: result });
            }
            continue;
          }

          // Final response: send what we already have (no extra API call)
          const finalContent = choice.message.content ?? "";
          send(JSON.stringify({ type: "delta", content: finalContent }));
          send(JSON.stringify({ type: "done" }));
          break;
        }
      } catch (err) {
        console.error("Chat error:", err);
        send(JSON.stringify({
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        }));
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
