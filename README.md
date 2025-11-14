# RAG Playground over My Music Theory Research

This project is a small but fully functional **Retrieval-Augmented Generation (RAG)** system built in TypeScript/Node.js.

It indexes a corpus of my own music-theory and game-music research (in `.txt` form), uses **OpenAI embeddings** for semantic search, and then calls a **chat model** with the retrieved chunks as context to answer questions grounded in those papers.

It’s intentionally simple, console-based, and heavily commented to make the RAG flow easy to follow and adapt.

---

## Features

- **TypeScript / Node.js** project (no framework, minimal dependencies)
- **Local corpus** in `data/` (my research articles as `.txt`)
- **Chunking**: documents are split into fixed-size text chunks for retrieval
- **Embedding-based retrieval**:
  - Uses `text-embedding-3-small` (cheap OpenAI embedding model)
  - Embeds each chunk **once**, caches to `data/embeddings.json`
  - Per-query: embeds the query and uses **cosine similarity** to find the best chunks
- **RAG prompt construction**:
  - Builds a `RagContext` object containing:
    - the original query
    - top `K` `ScoredChunk`s
    - a stitched `contextText` of sources
- **Generation**:
  - Calls `gpt-4o-mini` (cheap chat model) with:
    - system instructions (“answer using only these sources”)
    - user message containing `Question + Sources`
- **Interactive CLI**:
  - Run `npm run dev`
  - Type questions about the research
  - See:
    - which chunks were selected
    - the assembled “sources” context
    - the model’s grounded answer

---

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **LLM provider:** OpenAI
  - Embeddings: `text-embedding-3-small`
  - Chat: `gpt-4o-mini`

---

## Getting Started

### 1. Install dependencies

From the project root:

```bash
npm install
```

### 2. Create a `.env` with your OpenAI API key 

Create a file named `.env` in the project root:
```env
OPENAI_API_KEY=sk-your-real-key-here
```

### 3. Run the RAG playground
```bash
npm run dev
```
