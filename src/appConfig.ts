import path from "path";

export const MAX_CHARS_PER_CHUNK = 1200;
export const MAX_CHUNKS_PER_QUERY = 8;
export const MIN_CHARS_FOR_RETRIEVAL = 80;
export const EMBEDDING_MODEL_NAME = "text-embedding-3-small";
export const CHAT_MODEL_NAME = "gpt-5-nano";

//Pathing constants. Do not change.
export const NODES_PATH = path.join(process.cwd(), "data", "graph_nodes.json");
export const EDGES_PATH = path.join(process.cwd(), "data", "graph_edges.json");
export const EMBEDDINGS_CACHE_PATH = path.join(process.cwd(), "data", "embeddings.json");