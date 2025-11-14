import { promises as fs } from "fs";
import path from "path";
import { Chunk, EmbeddedChunk, ScoredChunk } from "./types"
import { embedTexts, EMBEDDING_MODEL_NAME } from "./embeddings";

const EMBEDDINGS_CACHE_PATH = path.join(process.cwd(), "data", "embeddings.json");

type EmbeddingsCacheFile = {
    model: string;
    chunks: EmbeddedChunk[];
};

export async function buildEmbeddedIndex(
    chunks: Chunk[]
) : Promise<EmbeddedChunk[]> {

    const cached = await loadEmbeddingsCache().catch(() => null);

    if (cached && cached.model === EMBEDDING_MODEL_NAME) {
        if (cached.chunks.length === chunks.length) {
        console.log("Loaded embeddings from cache.");
        return cached.chunks;
        } else {
            console.log(
                `Embeddings cache length mismatch (cache = ${cached.chunks.length}, current = ${chunks.length}); rebuilding.`
            );
        }
    } else {
        console.log("No valid embeddings cache found; building from scratch.");
    }

    const texts = chunks.map((c) => c.text);
    const embeddings = await embedTexts(texts);

    const embedded: EmbeddedChunk[] = chunks.map((chunk, index) => ({
        chunk,
        embedding: embeddings[index]
    }));

    const cacheData: EmbeddingsCacheFile = {
        model: EMBEDDING_MODEL_NAME,
        chunks: embedded,
    };

    await saveEmbeddingsCache(cacheData);
    console.log("Saved embeddings cache to disk");

    return embedded;
}

export function searchEmbeddedChunks(
    embeddedChunks: EmbeddedChunk[],
    queryEmbedding: number[],
    maxResults = 5
): ScoredChunk[] {
    const scored: ScoredChunk[] = [];

    for (const {chunk, embedding} of embeddedChunks) {
        const score = cosineSimilarity(embedding, queryEmbedding);
        scored.push({chunk, score});
    }

    scored.sort((a,b) => b.score - a.score);
    return scored.slice(0, maxResults);
}

async function loadEmbeddingsCache(): Promise<EmbeddingsCacheFile> {
    const raw = await fs.readFile(EMBEDDINGS_CACHE_PATH, "utf-8");
    return JSON.parse(raw) as EmbeddingsCacheFile;
}

async function saveEmbeddingsCache(data: EmbeddingsCacheFile): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    await fs.writeFile(EMBEDDINGS_CACHE_PATH, json, "utf-8");
}

function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error ("Embedding vectors must have the same length.");
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i=0; i<a.length; i++) {
        const va = a[i];
        const vb = b[i];

        dot += va * vb;
        normA += va * va;
        normB += vb * vb;
    }

    //avoid division by 0
    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
