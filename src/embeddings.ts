const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const EMBEDDING_MODEL_NAME = "text-embedding-3-small";

if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in the environment");
}

export async function embedTexts(texts: string[]): Promise<number[][]> {

    if (texts.length === 0) {
        return [];
    }

    const response = await fetch ("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL_NAME,
            input: texts,
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