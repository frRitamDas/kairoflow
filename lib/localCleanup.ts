import type { LanguageCode } from "./types";

const FILLERS: Record<LanguageCode, RegExp> = {
  en: /\b(um+|umm|uh+|uhh|erm|er+|ah+|aaa|like,?\s+you\s+know|you\s+know,?\s)/gi,
  hi: /\b(umm|uhh|aaa|aa|hmm|actually|matlab)\b/gi,
  hinglish: /\b(umm|uhh|aaa|aa|hmm|like|you\s+know|matlab)\b/gi,
};

/** Deterministic fallback so cleanup always does something useful without an API key. */
export function localCleanup(text: string, language: LanguageCode): string {
  let result = text.replace(FILLERS[language] ?? FILLERS.en, " ").replace(/\s{2,}/g, " ");
  result = result.replace(/\s+([,.!?;:])/g, "$1");
  result = result.replace(/([a-z])([A-Z])/g, "$1 $2");
  result = result.trim();
  if (!result) return text.trim();
  if (!/[.!?।]$/.test(result)) result += ".";
  return result.charAt(0).toUpperCase() + result.slice(1);
}
