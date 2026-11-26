import { NextResponse } from "next/server";
import { isFreeModel } from "@/lib/types";

type CleanupBody = {
  text?: string;
  apiKey?: string;
  model?: string;
  language?: string;
  mode?: "polish" | "rewrite";
  tone?: "concise" | "professional" | "friendly";
};

const SYSTEM_PROMPT = `You are Kairo's transcription editor. Clean up the user's dictated text.
Rules:
- Remove filler sounds and hesitation words such as umm, um, uhh, aa, aah, erm, like (when used as filler), you know.
- Fix obvious grammar and spelling mistakes without changing the meaning or the speaker's voice.
- Add correct punctuation and capitalization. Split into short, readable sentences or paragraphs when useful.
- For Hindi or Hinglish, keep the original script and natural code-mixing. Do not translate to English.
- Never invent facts. Never add commentary, quotes, headings, or markdown.
- Return ONLY the cleaned text.`;

const MODE_INSTRUCTIONS: Record<string, string> = {
  polish: "Goal: polish only. Keep every idea, just make it clean and readable.",
  rewrite: "Goal: rewrite for clarity and impact while preserving all facts and intent. Tighten structure and remove repetition.",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  concise: "Tone: brief, direct, no filler.",
  professional: "Tone: composed, professional, complete sentences.",
  friendly: "Tone: warm, natural, conversational.",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CleanupBody;
    const text = (body.text ?? "").trim();
    const apiKey = (body.apiKey ?? "").trim() || process.env.OPENROUTER_API_KEY || "";
    const model = (body.model ?? "").trim() || "openrouter/free";
    const language = (body.language ?? "en").trim();
    const mode = body.mode === "rewrite" ? "rewrite" : "polish";
    const tone = ["concise", "professional", "friendly"].includes(body.tone ?? "") ? body.tone! : "concise";

    // Kairo is zero-cost by design: paid models are rejected even if a key is supplied.
    if (!isFreeModel(model)) {
      return NextResponse.json({ error: "Only free OpenRouter models are allowed." }, { status: 400 });
    }

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
          {
            role: "system",
            content: `${SYSTEM_PROMPT}\n${MODE_INSTRUCTIONS[mode]}\n${TONE_INSTRUCTIONS[tone]}\nLanguage: ${language}`,
          },
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
