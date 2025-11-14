//Deprecated. Used in an earlier iteration
import {Chunk, ScoredChunk} from "./types";
import { searchChunks } from "./retrieval";

export type RagContext = {
    query: string;
    results: ScoredChunk[],
    contextText: string;
};

export function buildRagContext(
    chunks: Chunk[],
    query: string,
    maxResults = 5
) : RagContext {

    const results = searchChunks(chunks, query, maxResults);

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

    return {query,results,contextText};
}
