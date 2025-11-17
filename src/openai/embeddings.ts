import { EMBEDDING_MODEL_NAME } from "@/appConfig";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in the environment");
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  // Very light sanity: ensure all strings, trim NULs
  const input = texts.map((t, idx) => {
    const s = String(t ?? "").replace(/\u0000/g, "");
    const trimmed = s.trim();
    if (!trimmed) {
      // With the filtering in buildEmbeddedIndex, you ideally never hit this.
      console.warn(
        `embedTexts: empty string at index ${idx} after filtering; substituting placeholder.`
      );
      return "(empty)";
    }
    return trimmed;
  });

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL_NAME,
      input, // <== make sure this is the sanitized array
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Embeddings API error: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  const json = await response.json();
  return json.data.map((item: any) => item.embedding as number[]);
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text]);
  return embedding;
}