import { NextResponse } from "next/server";

type CleanupBody = {
  text?: string;
  apiKey?: string;
  model?: string;
  language?: string;
};

const SYSTEM_PROMPT = `You are Kairo's transcription editor. Clean up the user's dictated text.
Rules:
- Remove filler sounds and hesitation words such as umm, um, uhh, aa, aah, erm, like (when used as filler), you know.
- Fix obvious grammar and spelling mistakes without changing the meaning or the speaker's voice.
- Add correct punctuation and capitalization. Split into short, readable sentences or paragraphs when useful.
- For Hindi or Hinglish, keep the original script and natural code-mixing. Do not translate to English.
- Never invent facts. Never add commentary, quotes, headings, or markdown.
- Return ONLY the cleaned text.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CleanupBody;
    const text = (body.text ?? "").trim();
    const apiKey = (body.apiKey ?? "").trim() || process.env.OPENROUTER_API_KEY || "";
    const model = (body.model ?? "").trim() || "openai/gpt-4o-mini";
    const language = (body.language ?? "en").trim();

    if (!text) return NextResponse.json({ error: "Nothing to clean up yet." }, { status: 400 });
    if (!apiKey) {
      return NextResponse.json({ error: "No OpenRouter API key configured." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || origin,
        "X-Title": "Kairo",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 2048,
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\nLanguage: ${language}` },
          { role: "user", content: text },
        ],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.error?.message || `OpenRouter request failed (${response.status}).`;
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const cleaned = data?.choices?.[0]?.message?.content;
    if (typeof cleaned !== "string" || !cleaned.trim()) {
      return NextResponse.json({ error: "The model returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({ text: cleaned.trim().replace(/^```(?:text|markdown)?\s*|\s*```$/g, "") });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Cleanup timed out. Please try again."
      : "Could not reach OpenRouter. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
