interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
}

export async function webSearchTrends(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return "[NO_KEY] Tavily API key not set.";

  // Try Bearer auth (current Tavily API)
  const tryFetch = async (useBearer: boolean) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const body: Record<string, unknown> = {
      query,
      max_results: 5,
      search_depth: "basic",
      include_answer: true,
    };

    if (useBearer) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
      body["api_key"] = apiKey;
    }

    return fetch("https://api.tavily.com/search", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  };

  let res = await tryFetch(true);

  // Fall back to legacy api_key-in-body if Bearer fails
  if (!res.ok && res.status === 401) {
    console.log("Tavily: Bearer auth failed, trying legacy api_key body...");
    res = await tryFetch(false);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    console.error("Tavily error:", res.status, errText);
    return `[SEARCH_FAILED:${res.status}]`;
  }

  const data: TavilyResponse = await res.json();
  console.log("Tavily success:", data.results?.length ?? 0, "results");

  const lines: string[] = [];

  if (data.answer) {
    lines.push(`SUMMARY: ${data.answer}\n`);
  }

  if (data.results?.length) {
    lines.push("REFERENCES:");
    data.results.forEach((r, i) => {
      lines.push(`[${i + 1}] ${r.title}`);
      lines.push(`URL: ${r.url}`);
      lines.push(r.content.slice(0, 300));
      lines.push("");
    });
  }

  return lines.join("\n");
}
