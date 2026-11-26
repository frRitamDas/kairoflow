import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const providedKey = String(form.get("apiKey") ?? "").trim();
    const apiKey = providedKey || process.env.GROQ_API_KEY || "";
    const language = String(form.get("language") ?? "en");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No audio was recorded." }, { status: 400 });
    }
    if (file.size > 24 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio is too large. Keep recordings under 24 MB." }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "No Groq API key configured." }, { status: 400 });
    }

    const groqForm = new FormData();
    groqForm.append("file", file, "kairo-audio.webm");
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("response_format", "json");
    groqForm.append("temperature", "0");
    if (language !== "en") {
      groqForm.append(
        "prompt",
        language === "hi"
          ? "This is a Hindi dictation. Transcribe in Devanagari script."
          : "This is a casual Hinglish dictation mixing Hindi and English. Transcribe naturally in Latin script.",
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.error?.message || `Groq transcription failed (${response.status}).`;
      return NextResponse.json({ error: message }, { status: 502 });
    }
    if (typeof data?.text !== "string") {
      return NextResponse.json({ error: "Groq returned an empty transcript." }, { status: 502 });
    }

    return NextResponse.json({ text: data.text.trim() });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Transcription timed out. Please try a shorter recording."
      : "Could not reach Groq. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
