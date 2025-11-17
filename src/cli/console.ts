import readline from "readline";
import { getPreview } from "@/library/textUtils";
import { ResearchDoc, RagContext } from "@/library/types";

export type RetrievalMode = "keyword" | "embedding" | "graph";

export async function promptToggleVerbose(): Promise<boolean> {
    const answer = await ask(
        "Enable verbose mode? [y]/n: "
    );
    const verbose = answer.toLowerCase().trim() !== 'n';
    console.log(verbose ? "Enabling verbose mode.\n" : "Disabling verbose mode.\n");
    return verbose;
}

export async function promptRetrievalMode(): Promise<RetrievalMode> {
  const answer = await ask(
    "Select retrieval mode: [1] keyword, [2] embedding, [3] graph (default): "
  );

  const trimmed = answer.trim();

  let mode: RetrievalMode;
  if (trimmed === "1") mode = "keyword";
  else if (trimmed === "2") mode = "embedding";
  else mode = "graph";
  console.log(`Using retrieval mode: ${mode}\n`);

  return mode;
}

export function promptQuery(
    promptText = "Enter a search query (or press Enter to exit): "
): Promise<string> {
    return ask(promptText);
}

export function previewDocs(docs: ResearchDoc[]): void {
    for (const doc of docs) {
        const preview = getPreview(doc.content, 200);
        console.log(`--- [${doc.id}] (${doc.filename}) ---`);
        console.log(preview);
        console.log();
    }
}

export function previewRagContext(ragContext: RagContext, query: string): void {
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
}

export function logQueryStart(): void {
  console.log("Querying...");
}

export function printModelAnswer(answer: string): void {
  console.log("=== Model answer ===");
  console.log(answer);
  console.log("\n===========================================\n");
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}