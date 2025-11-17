import { promises as fs } from "fs";
import path from "path";
import { ResearchDoc, Chunk } from "@/library/types";

export async function loadResearchDocs() : Promise<ResearchDoc[]> {
    const dataDir = path.join(process.cwd(), "data/corpus");
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
    maxCharsPerChunk: number
): Chunk[] {
    const chunks: Chunk[] = [];

    for (const doc of docs) {
        const { id: docId, content } = doc;

        const paragraphs = content
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0);

        let buffer = "";
        let chunkIndex = 0;

        const pushChunk = (text: string) => {
            chunks.push({
                docId,
                chunkIndex,
                text: text.trim(),
            });
            chunkIndex++;
        };
        
        for (const para of paragraphs) {
            const paraText = para + "\n\n";

            if (paraText.length > maxCharsPerChunk) {
            if (buffer.length > 0) {
                const spaceLeft = maxCharsPerChunk - buffer.length;
                if (spaceLeft > 0) {
                // first chunk = buffer + first slice of big para
                const firstSlice = paraText.slice(0, spaceLeft);
                pushChunk(buffer + firstSlice);
                let start = spaceLeft;
                while (start < paraText.length) {
                    const end = start + maxCharsPerChunk;
                    pushChunk(paraText.slice(start, end));
                    start = end;
                }
                } else {
                // buffer is already "full", so flush it and slice para as before
                pushChunk(buffer);
                let start = 0;
                while (start < paraText.length) {
                    const end = start + maxCharsPerChunk;
                    pushChunk(paraText.slice(start, end));
                    start = end;
                }
                }
                buffer = "";
            } else {
                // no buffer, just slice the big paragraph
                let start = 0;
                while (start < paraText.length) {
                const end = start + maxCharsPerChunk;
                pushChunk(paraText.slice(start, end));
                start = end;
                }
            }
            continue;
            }

            if (buffer.length + paraText.length <= maxCharsPerChunk) {
                buffer += paraText;
            } else {
                if (buffer.length > 0) {
                    pushChunk(buffer);
                }
                buffer = paraText;
            }
        }
        if (buffer.length > 0) {
            pushChunk(buffer);
        }
    }

    return chunks;
}