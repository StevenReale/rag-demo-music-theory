import { RagContext } from "./ragPipeline";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in the environment");
}

export async function generateAnswer(ragContext: RagContext): Promise<string> {
    if (!ragContext.query.trim()) {
        return "No question provided.";
    }

    if (!ragContext.contextText.trim()) {
        return "I don't have any relevant context to answer this question.";
    }

    const messages = [
        {
            role: "system",
            content:         
            "You are an assistant that answers questions about Steven Reale's music theory and game-music research. " +
            "Use only the information in the provided sources. " +
            "If the answer is not clearly supported by the sources, say you don't know.",
        },
        {
            role: "user",
            content:
            `Question:\n${ragContext.query}\n\n` +
            `Sources:\n${ragContext.contextText}`,
        },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-5-nano",
            messages,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
            `Chat API error: ${response.status} ${response.statusText} - ${errorBody}`
        )
    }

    const json = await response.json();

    const content =
        json.choices?.[0]?.message?.content ?? "[No content returned from model]";
    
    return content as string;
}