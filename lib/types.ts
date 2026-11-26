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

export const MODELS = [
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini", note: "Fast · balanced" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", note: "Excellent grammar" },
  { id: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku", note: "Natural · concise" },
  { id: "google/gemini-flash-1.5", label: "Gemini Flash 1.5", note: "Multilingual" },
];

export const DEFAULT_SETTINGS: Settings = {
  aiCleanup: true,
  engine: "browser",
  language: "en",
  openrouterKey: "",
  groqKey: "",
  model: "openai/gpt-4o-mini",
  autoSave: true,
};

export function languageSpeechCode(code: LanguageCode): string {
  return LANGUAGES.find((l) => l.code === code)?.speech ?? "en-US";
}

export function languageLabel(code: LanguageCode): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? "English";
}
