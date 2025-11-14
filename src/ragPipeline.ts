import { EmbeddedChunk, ScoredChunk } from "./types";
import { embedText } from "./embeddings";
import { searchEmbeddedChunks } from "./embeddingRetrieval";

export type RagContext = {
    query: string;
    results: ScoredChunk[],
    contextText: string;
};

export async function buildRagContext(
    embeddedChunks: EmbeddedChunk[],
    query: string,
    maxResults = 5
) : Promise<RagContext> {

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        return {
            query: "",
            results: [],
            contextText: ""
        };
    }

    const queryEmbedding = await embedText(trimmedQuery);
    const results = searchEmbeddedChunks(embeddedChunks, queryEmbedding, maxResults);
    const contextPieces = results.map((result, i) => {
        const {chunk, score} = result;
        return [
            `Source ${i + 1}`,
            `doc: ${chunk.docId}`,
            `chunkIndex: ${chunk.chunkIndex}`,
            `score: ${score}`,
            "",
            chunk.text.trim(),
        ].join("\n");
    })

    const contextText = contextPieces.join("\n\n--------------------\n\n");

    return {query: trimmedQuery,results,contextText};
}
