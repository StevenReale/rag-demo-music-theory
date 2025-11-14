//Deprecated. Used in an early iteration.
import {Chunk, ScoredChunk} from "./types";

export function searchChunks(
    chunks: Chunk[],
    query: string,
    maxResults = 5
) : ScoredChunk[] {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) { return []; }

    const scored: ScoredChunk[] = [];

    for (const chunk of chunks) {
        const textLower = chunk.text.toLowerCase();
        let count = 0;
        let index = textLower.indexOf(normalizedQuery);

        while (index !== -1) {
            count++;
            index = textLower.indexOf(normalizedQuery, index + normalizedQuery.length);
        }

        if (count > 0) {
            scored.push({chunk, score: count});
        }
    }

    scored.sort((a,b) => b.score-a.score);

    return scored.slice(0, maxResults);
}

