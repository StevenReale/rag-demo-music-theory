const STOPWORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "have", "your",
  "you", "are", "was", "were", "but", "not", "can", "will", "would",
  "could", "should", "into", "about", "what", "when", "where", "which",
  "how", "why", "then", "than", "their", "there", "here", "them",
  "they", "our", "out", "all", "any", "just", "like", "more", "some",
  "such", "also", "its", "over", "under", "between", "in", "on", "of",
  "to", "as", "at", "by", "is", "it", "a", "an"
]);

type TokenizeOptions = {
  removeStopwords?: boolean;
  minLength?: number;
};

/**
 * Shared query tokenizer:
 * - lowercases
 * - splits on non-word characters
 * - filters by length
 * - optional stopword removal
 * - deduplicates tokens
 */
export function tokenizeQuery(
  query: string,
  options: TokenizeOptions = {}
): string[] {
  const { removeStopwords = false, minLength = 3 } = options;

  const rawTokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length >= minLength);

  const filtered = removeStopwords
    ? rawTokens.filter((t) => !STOPWORDS.has(t))
    : rawTokens;

  // dedupe
  return Array.from(new Set(filtered));
}