export type LanguageCode = "en" | "hi" | "hinglish";

export type Engine = "browser" | "groq";

export type Transcript = {
  id: string;
  raw_text: string;
  final_text: string;
  language: LanguageCode;
  source: Engine;
  polished: boolean;
  duration_ms: number;
  created_at: string;
};

export type Settings = {
  aiCleanup: boolean;
  engine: Engine;
  language: LanguageCode;
  openrouterKey: string;
  groqKey: string;
  model: string;
  autoSave: boolean;
};

export const LANGUAGES: { code: LanguageCode; label: string; native: string; speech: string; flag: string }[] = [
  { code: "en", label: "English", native: "English", speech: "en-US", flag: "EN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", speech: "hi-IN", flag: "HI" },
  { code: "hinglish", label: "Hinglish", native: "हिंग्लिश", speech: "en-IN", flag: "HG" },
];

// Zero-cost only. Every option here is an OpenRouter free-tier model.
// `openrouter/free` auto-routes to whichever free model is available.
export const MODELS = [
  { id: "openrouter/free", label: "Free auto-router", note: "₹0 · best available" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B", note: "₹0 · strong grammar" },
  { id: "openai/gpt-oss-20b:free", label: "GPT-OSS 20B", note: "₹0 · fast" },
  { id: "google/gemma-3-27b-it:free", label: "Gemma 3 27B", note: "₹0 · multilingual" },
  { id: "qwen/qwen3-235b-a22b:free", label: "Qwen3 235B", note: "₹0 · Hinglish friendly" },
];

/** Hard guard: never allow a paid OpenRouter model to be called. */
export function isFreeModel(model: string): boolean {
  return model === "openrouter/free" || model.endsWith(":free");
}

export const DEFAULT_SETTINGS: Settings = {
  aiCleanup: true,
  engine: "browser",
  language: "en",
  openrouterKey: "",
  groqKey: "",
  model: "openrouter/free",
  autoSave: true,
};

export function languageSpeechCode(code: LanguageCode): string {
  return LANGUAGES.find((l) => l.code === code)?.speech ?? "en-US";
}

export function languageLabel(code: LanguageCode): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? "English";
}
