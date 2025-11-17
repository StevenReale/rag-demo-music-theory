import path from "path";
import { EmbeddedChunk, ScoredChunk, RagContext } from "@/library/types";
import { KnowledgeGraph, GraphNode } from "@/model/knowledgeGraph";
import { embedText } from "@/openai/embeddings";
import { searchEmbeddedChunks } from "@/retrieval/embeddingRetrieval";
import { tokenizeQuery } from "@/library/queryUtils";
import { buildContextText } from "./buildContextText";

type GraphRagContext = RagContext & {
    graphNodes: GraphNode[];
}

export async function buildRagContextGraph(
    graph: KnowledgeGraph,
    embeddedChunks: EmbeddedChunk[],
    query: string,
    maxResults = 5,
    verbose = false
): Promise<GraphRagContext> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        return {
            query: "",
            results: [],
            contextText: "",
            graphNodes: []
        };
    }

    const matchedNodes = selectGraphNodesForQuery(graph, trimmedQuery);
    const expandedNodes = expandToNeighborNodes(graph, matchedNodes);

    if (verbose) {
        if(matchedNodes.length === 0) {
            console.log("Graph mode: no graph nodes matched this query.");
        } else {
            console.log("Graph mode: matched graph nodes:");
            for (const node of matchedNodes) {
                console.log(`  - [${node.type}] ${getNodeLabel(node)} (id=${node.id})`);
            }
            console.log();
        }

        if (expandedNodes.length > matchedNodes.length) {
            console.log("Graph mode: including neighbor nodes:");
            for (const node of expandedNodes) {
                if(!matchedNodes.find(n => n.id === node.id)) {
                    console.log(`  - [${node.type}] ${getNodeLabel(node)} (id=${node.id})`);
                }
            }
        }
        console.log();
    }

    const allowedDocIds = new Set<string>();
    for (const node of expandedNodes) {
        const docId = getDocIdFromNode(node);
        if(docId) {
            allowedDocIds.add(docId);
        }
    }

    let candidateChunks = embeddedChunks;
    if (allowedDocIds.size > 0) {
        candidateChunks = embeddedChunks.filter((ec) =>
        allowedDocIds.has(ec.chunk.docId)
        );

        if (verbose) {
        console.log(
            `Graph mode: restricting retrieval to ${candidateChunks.length} chunk(s) from ${allowedDocIds.size} work node(s).\n`
        );
        }
    } else if (verbose) {
        console.log(
        "Graph mode: no work nodes resolved to documents; falling back to full corpus for retrieval.\n"
        );
    }

    const queryEmbedding = await embedText(trimmedQuery);

    const poolSize = maxResults * 3;
    const scoredPool = searchEmbeddedChunks(candidateChunks, queryEmbedding, poolSize);
    
    const targetDocIds = new Set<string>();
    for (const node of expandedNodes) {
        const docId = getDocIdFromNode(node);
        if (docId) targetDocIds.add(docId);
    }

    let finalResults: ScoredChunk[];

    if (targetDocIds.size > 1) {
        finalResults = selectBalancedAcrossDocs(scoredPool, targetDocIds, maxResults);
    } else {
        finalResults = scoredPool.slice(0, maxResults);
    }
    
    const { contextText } = buildContextText(trimmedQuery, finalResults);

    return {
        query: trimmedQuery,
        results: finalResults,
        contextText,
        graphNodes: expandedNodes
    }
}

function getNodeLabel(node: GraphNode): string {
  if (node.type === "work") {
    return node.title ?? node.short_title ?? node.id;
  }

  const base = node.name ?? node.id;
  return node.description ? `${base} ${node.description}` : base;
}

function selectGraphNodesForQuery(
    graph: KnowledgeGraph,
    query: string,
    maxNodes = 5
): GraphNode[] {
    const terms = tokenizeQuery(query, { removeStopwords: false, minLength: 3 });
    if (terms.length === 0) return [];

    const scores: {node: GraphNode; score: number}[] = [];

    for (const node of graph.nodes) {
        const label = getNodeLabel(node).toLowerCase();
        let score = 0;

        for (const term of terms) {
            if (label.includes(term)) {
                score++;
            }
        }

        if (score > 0) {
            scores.push({ node, score});
        }
    }

    scores.sort((a,b) => b.score - a.score);
    return scores.slice(0, maxNodes).map((s) => s.node);
}

function expandToNeighborNodes(
    graph: KnowledgeGraph,
    seeds: GraphNode[]
): GraphNode[] {
    const idToNode = new Map<string, GraphNode>();
    for (const n of graph.nodes) {
        idToNode.set(n.id, n);
    }

    const selectedIds = new Set<string>(seeds.map((n) => n.id));

    for (const edge of graph.edges) {
        if (selectedIds.has(edge.source) && !selectedIds.has(edge.target)) {
            selectedIds.add(edge.target);
        }
        if (selectedIds.has(edge.target) && !selectedIds.has(edge.source)) {
            selectedIds.add(edge.source);
        }
    }

    const result: GraphNode[] = [];
    for (const id of selectedIds) {
        const node = idToNode.get(id);
        if (node) result.push(node);
    }
    return result;
}

function getDocIdFromNode(node: GraphNode): string | null {
    if (node.type !== "work" || !node.source_file) return null;

    const base = path.basename(node.source_file, path.extname(node.source_file));
    return base;
}

function selectBalancedAcrossDocs(
    scored: ScoredChunk[],
    targetDocIds: Set<string>,
    maxResults: number
): ScoredChunk[] {
    if (maxResults <= 0 || scored.length === 0) return [];

    const selected: ScoredChunk[] = [];
    const perDocCounts = new Map<string, number>();
    const selectedKeys = new Set<string>();

    const targetDocIdList = Array.from(targetDocIds);
    const docCount = targetDocIdList.length || 1;
    const perDocLimit = Math.max(1, Math.floor(maxResults / docCount));

    const makeKey = (c: ScoredChunk) => 
        `${c.chunk.docId}|${c.chunk.chunkIndex}`;
    
    for (const sc of scored) {
        if (selected.length >= maxResults) break;

        const docId = sc.chunk.docId;
        if (!targetDocIds.has(docId)) continue;

        const key = makeKey(sc);
        if (selectedKeys.has(key)) continue;

        const count = perDocCounts.get(docId) ?? 0;
        if (count >= perDocLimit) continue;

        selected.push(sc);
        selectedKeys.add(key);
        perDocCounts.set(docId, count + 1);
    }

    if (selected.length < maxResults) {
        for (const sc of scored) {
            if (selected.length >= maxResults) break;

            const key = makeKey(sc);
            if (selectedKeys.has(key)) continue;

            selected.push(sc);
            selectedKeys.add(key);
        }
    }

    return selected;
}