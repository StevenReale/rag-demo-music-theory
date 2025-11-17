export type ResearchDoc = {
    id: string;
    filename: string;
    content: string;
};

export type Chunk = {
    docId: string;
    chunkIndex: number;
    text: string;
};

export type ScoredChunk = {
    chunk: Chunk;
    score: number;
};

export type EmbeddedChunk = {
    chunk: Chunk;
    embedding: number[];
};

export type RagContext = {
    query: string;
    results: ScoredChunk[];
    contextText: string;
};