import { promises as fs } from "fs";
import { NODES_PATH, EDGES_PATH } from "@/appConfig";

export type GraphNodeType =
  | "work"
  | "game"
  | "media"
  | "artist"
  | "performance"
  | "concept"
  | (string & {}); // allow future types without breaking

export type MediaType = "film" | "tv_episode" | (string & {});

export type GraphNode = {
  id: string;
  type: GraphNodeType;
  description?: string;

  // For works
  title?: string;
  short_title?: string;
  source_file?: string;

  // For games / artists / performances / concepts
  name?: string;

  // For media nodes
  media_type?: MediaType;
};

export type GraphEdge = {
  source: string; // node id
  target: string; // node id
  type: string;   // "analyzes", "performed_by", etc.
  description?: string;
};

export type KnowledgeGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export async function loadKnowledgeGraph(): Promise<KnowledgeGraph> {
  const [nodesRaw, edgesRaw] = await Promise.all([
    fs.readFile(NODES_PATH, "utf-8"),
    fs.readFile(EDGES_PATH, "utf-8"),
  ]);

  const nodes = JSON.parse(nodesRaw) as GraphNode[];
  const edges = JSON.parse(edgesRaw) as GraphEdge[];

  if (!Array.isArray(nodes)) {
    throw new Error("graph_nodes.json is not an array.");
  }
  if (!Array.isArray(edges)) {
    throw new Error("graph_edges.json is not an array.");
  }

  return { nodes, edges };
}