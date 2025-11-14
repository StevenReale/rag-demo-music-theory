import { promises as fs } from "fs";
import path from "path";
import { ResearchDoc, Chunk } from "./types";

export async function loadResearchDocs() : Promise<ResearchDoc[]> {
    const dataDir = path.join(process.cwd(), "data");
    const files = await fs.readdir(dataDir);
    const txtFiles = files.filter((f) => f.toLowerCase().endsWith(".txt"));
    const docs: ResearchDoc[] = [];

    for (const filename of txtFiles) {
        const fullPath = path.join(dataDir, filename);
        const content = await fs.readFile(fullPath, "utf-8");
        const id = filename.replace(/\.txt$/i, "");

        docs.push({id, filename, content});
    }
    
    return docs;
}

export function chunkDocs(
    docs: ResearchDoc[],
    maxCharsPerChunk = 800
): Chunk[] {
    const chunks: Chunk[] = [];

    for (const doc of docs) {
        const { id: docId, content } = doc;

        let start = 0;
        let chunkIndex = 0;

        while (start < content.length) {
            const end = Math.min(start + maxCharsPerChunk, content.length);
            const text = content.slice(start, end);

            chunks.push({docId, chunkIndex, text});

            start = end;
            chunkIndex++;
        }
    }

    return chunks;
}