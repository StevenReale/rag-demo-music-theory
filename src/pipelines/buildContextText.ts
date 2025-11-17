import { ScoredChunk, RagContext } from "@/library/types";

export function buildContextText(query: string, results: ScoredChunk[]): RagContext {
    
    if (results.length === 0) {
        return {
          query,
          results: [],
          contextText: "",
        };
    }

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

    return {query, results, contextText};
}