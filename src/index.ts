import "dotenv/config";
import { loadResearchDocs, chunkDocs } from "./corpus";
import { getPreview } from "./textUtils";
import { promptQuery } from "./console"
import { buildRagContext } from "./ragPipeline";
import { EmbeddedChunk } from "./types";
import { buildEmbeddedIndex } from "./embeddingRetrieval";
import { generateAnswer } from "./generation";

async function main() {
    console.log("RAG playground starting...");

    const docs = await loadResearchDocs();

    console.log(`Loaded ${docs.length} research document(s).\n`);

    for (const doc of docs) {
        const preview = getPreview(doc.content, 200);
        console.log(`--- [${doc.id}] (${doc.filename}) ---`);
        console.log(preview);
        console.log();
    }

    const chunks = chunkDocs(docs, 800);
    console.log(`Created ${chunks.length} chunk(s) total.\n`);

    console.log("Computing embeddings for all chunks / loading cache...");
    const embeddedChunks: EmbeddedChunk[] = await buildEmbeddedIndex(chunks);
    console.log(`Embedded ${embeddedChunks.length} chunks.\n`);

    while(true) {
        const query = await promptQuery();

        if (!query.trim()) {
            console.log("No query entered. Exiting.");
            break;
        }

        const ragContext = await buildRagContext(embeddedChunks, query, 5);

        if (ragContext.results.length === 0) {
            console.log("No matching chunks found.\n");
            continue;
        }

        console.log(`\nTop ${ragContext.results.length} chunks for query: "${query}"\n`);

        for (const {chunk, score} of ragContext.results) {
            const preview = getPreview(chunk.text, 200);
            console.log(
                `Score = ${score} | doc=${chunk.docId} | chunkIndex = ${chunk.chunkIndex}`
            );
            console.log(preview);
            console.log();
        }
        console.log("=== RAG context being sent to the LLM ===\n");
        console.log(`User question:\n${ragContext.query}\n`);
        console.log("Retrieved context:\n");
        console.log(ragContext.contextText);
        console.log("\n===========================================\n");

        console.log("===Model answer===");
        const answer = await generateAnswer(ragContext);
        console.log(answer);
        console.log("\n===========================================\n");        
    }
}

main().catch(err => {
    console.error("Error in main(): ", err);
})