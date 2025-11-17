import { Chunk, EmbeddedChunk, RagContext} from "@/library/types";
import { embedText } from "@/openai/embeddings";
import { searchEmbeddedChunks } from "@/retrieval/embeddingRetrieval";
import { searchChunks } from "@/retrieval/keywordRetrieval";
import { buildContextText } from "./buildContextText";

export function buildRagContextKeyword(
    chunks: Chunk[],
    query: string,
    maxResults = 5,
    verbose: boolean
) : RagContext {

  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return {
      query: "",
      results: [],
      contextText: "",
    };
  }
  
  const results = searchChunks(chunks, trimmedQuery, maxResults, verbose);
  return buildContextText(trimmedQuery, results);
}

export async function buildRagContextEmbedded(
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
    return buildContextText(trimmedQuery, results);
}
