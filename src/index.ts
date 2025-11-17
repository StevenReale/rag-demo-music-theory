import "dotenv/config";
import { loadResearchDocs, chunkDocs } from "@/model/corpus";
import * as cli from "@/cli/console";
import { buildRagContextEmbedded, buildRagContextKeyword } from "@/pipelines/flatRagPipeline";
import { EmbeddedChunk, RagContext } from "@/library/types";
import { buildEmbeddedIndex } from "@/retrieval/embeddingRetrieval";
import { generateAnswer } from "@/openai/generation";
import { loadKnowledgeGraph, KnowledgeGraph } from "@/model/knowledgeGraph";
import { buildRagContextGraph } from "@/pipelines/graphRagPipeline";
import { MAX_CHUNKS_PER_QUERY, MAX_CHARS_PER_CHUNK } from "./appConfig";

async function main() {
    console.log("RAG playground starting...");

    //prompt for operating modes
    const verbose: boolean = await cli.promptToggleVerbose();
    const mode: cli.RetrievalMode = await cli.promptRetrievalMode();
    
    //load research docs
    const docs = await loadResearchDocs();
    console.log(`Loaded ${docs.length} research document(s).\n`);
    if (verbose) cli.previewDocs(docs);
    
    //chunk docs
    const chunks = chunkDocs(docs, MAX_CHARS_PER_CHUNK);
    console.log(`Created ${chunks.length} chunk(s) total.\n`);

    //embed if requested
    let embeddedChunks: EmbeddedChunk[] | null = null;
    if (mode === "embedding" || mode === "graph"){
        console.log("Computing embeddings for all chunks / loading cache...");
        embeddedChunks = await buildEmbeddedIndex(chunks);
        console.log(`Embedded ${embeddedChunks.length} chunks.\n`);
    }

    //generate graph in graph mode
    let graph: KnowledgeGraph | null = null;
    if (mode === "graph"){
        graph = await loadKnowledgeGraph();
    }

    //main querying loop
    while(true) {
        const query = await cli.promptQuery();
        if (!query.trim()) {
            console.log("No query entered. Exiting.");
            break;
        }

        let ragContext: RagContext;

        if (mode === "keyword") {
        ragContext = buildRagContextKeyword(chunks, query, MAX_CHUNKS_PER_QUERY, verbose);
        } else if (mode === "embedding") {
        if (!embeddedChunks) {
            throw new Error("Embedded index not initialized.");
        }
        ragContext = await buildRagContextEmbedded(embeddedChunks, query, MAX_CHUNKS_PER_QUERY);
        } else {
            // graph mode
            if (!embeddedChunks) {
                throw new Error("Embedded index not initialized.");
            }
            if(!graph) throw new Error("Knowledge graph not initialized.");

            ragContext = await buildRagContextGraph(
                graph,
                embeddedChunks,
                query,
                MAX_CHUNKS_PER_QUERY,
                verbose
            );
        }
        
        if (ragContext.results.length === 0) {
            console.log("No matching chunks found.\n");
            continue;
        }

        if (verbose) cli.previewRagContext(ragContext, query);

        cli.logQueryStart();
        const answer = await generateAnswer(ragContext);
        cli.printModelAnswer(answer);
    }
}

main().catch(err => {
    console.error("Error in main(): ", err);
})