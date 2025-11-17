export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// Make a short preview with "..." if it's longer than maxChars
export function getPreview(text: string, maxChars = 200): string {
  const normalized = collapseWhitespace(text);
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return normalized.slice(0, maxChars) + "...";
}