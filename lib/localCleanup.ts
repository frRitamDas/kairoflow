import type { LanguageCode } from "./types";

const FILLERS: Record<LanguageCode, RegExp> = {
  en: /\b(um+|umm|uh+|uhh|erm|er+|ah+|aaa|like,?\s+you\s+know|you\s+know,?\s)/gi,
  hi: /\b(umm|uhh|aaa|aa|hmm|actually|matlab)\b/gi,
  hinglish: /\b(umm|uhh|aaa|aa|hmm|like|you\s+know|matlab)\b/gi,
};

/** Deterministic fallback so cleanup always does something useful without an API key. */
export function localCleanup(text: string, language: LanguageCode): string {
  let result = text.replace(FILLERS[language] ?? FILLERS.en, " ").replace(/\s{2,}/g, " ");
  result = result.replace(/\s+([,.!?;:])/g, "$1").replace(/([,.!?;:])\s+/g, "$1 ");
  result = result.replace(/([a-z])([A-Z])/g, "$1 $2");
  if (language !== "hi") result = result.replace(/\bi\b/g, "I");
  result = result.replace(/(^|[.!?।]\s+)([a-z])/g, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase());
  result = result.trim();
  if (!result) return text.trim();
  if (!/[.!?।]$/.test(result)) result += ".";
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/** Free, deterministic rewrite used when no OpenRouter key is added. */
export function localRewrite(text: string, language: LanguageCode, tone: "concise" | "professional" | "friendly" = "concise"): string {
  const polished = localCleanup(text, language);
  const sentences = polished.split(/(?<=[.!?।])\s+/).filter(Boolean);

  if (tone === "concise") {
    const keep = sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 2))).join(" ");
    return keep.replace(/\.$/, "") + ".";
  }
  if (tone === "professional") {
    return polished.replace(/'m|'ve|'re|'ll/g, (match: string) => (
      { "'m": " am", "'ve": " have", "'re": " are", "'ll": " will" }[match] ?? match
    ));
  }
  return polished.replace(/\.$/, "") + " Hope that helps.";
}
