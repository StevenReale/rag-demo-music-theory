// Keyword-based retrieval using TF-IDF-style scoring.
import {Chunk, ScoredChunk} from "@/library/types";
import { tokenizeQuery } from "@/library/queryUtils";
import { MIN_CHARS_FOR_RETRIEVAL } from "@/appConfig";

export function searchChunks(
    chunks: Chunk[],
    query: string,
    maxResults = 5,
    verbose: boolean
) : ScoredChunk[] {

    const terms = tokenizeQuery(query, { removeStopwords: true, minLength: 3 });
    if (terms.length === 0) {
        return [];
    }

    const candidateChunks = chunks.filter(
        c => c.text.trim().length >= MIN_CHARS_FOR_RETRIEVAL
    );

    const documentFrequencies = getDocumentFrequencies(terms, candidateChunks);
    if (documentFrequencies.size === 0) {
        return [];
    }

    const inverseDocumentFrequency = getIDF(documentFrequencies, candidateChunks.length);

    if (verbose) {
        console.log("Keyword mode: query terms and their IDF weights:");
        for (const [term, dfTerm] of documentFrequencies) {
        const idfVal = inverseDocumentFrequency.get(term)!;
        console.log(
            `  term="${term}" -> df=${dfTerm}/${candidateChunks.length}, idf=${idfVal.toFixed(3)}`
        );
        }
        console.log();
    }

    const scored: ScoredChunk[] = [];

    for (const chunk of candidateChunks) {
        const textLower = chunk.text.toLowerCase();
        let score = 0;

        for (const [term, idfVal] of inverseDocumentFrequency) {
            let termFrequency = 0;
            let index = textLower.indexOf(term);
            while (index !== -1) {
                termFrequency++;
                index = textLower.indexOf(term, index + term.length)
            }

            if (termFrequency > 0) {
                score += termFrequency * idfVal;
            }
        }
        
        if (score > 0) {
            scored.push({chunk, score});
        }
    }

    scored.sort((a,b) => b.score-a.score);

    return scored.slice(0, maxResults);
}

function getDocumentFrequencies(terms: string[], chunks: Chunk[]): Map<string,number> {
    const df = new Map<string, number>();

    for (const term of terms) {
        let count = 0;
        for (const chunk of chunks) {
            const text = chunk.text.toLowerCase();
            if (text.includes(term)) {
                count++;
            }
        }
        if (count > 0) {
            df.set(term, count);
        }
    }
    return df;
}

function getIDF(dfMap: Map<string, number>, chunksCount: number): Map<string, number> {
    const idf = new Map<string, number>();
    for (const [term, dfTerm] of dfMap) {
        idf.set(term, Math.log(chunksCount / dfTerm));
    }
    return idf;
}
