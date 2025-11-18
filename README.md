# RAG Playground over My Music Theory Research

This project is a small but fully functional **Retrieval-Augmented Generation (RAG)** system built in TypeScript/Node.js.

It indexes a corpus of my own music-theory and game-music research (exported as `.txt` files), builds both **flat** and **graph-aware** retrieval pipelines, and then calls an OpenAI chat model with the retrieved chunks as context to answer questions grounded in those papers.

The goal is twofold:

- Give me a fast way to query my own research corpus.
- Serve as a learning playground for RAG / GraphRAG concepts (chunking, embeddings, TF–IDF, cosine similarity, knowledge graphs, etc.).

---

## Features

- **TypeScript / Node.js** (no framework, minimal dependencies)
- **Local corpus** in `data/corpus/` (plain-text exports of my articles)
- **Chunking**:
  - Documents are split into paragraph-based chunks (~`MAX_CHARS_PER_CHUNKS` characters).
  - Short paragraphs are grouped; oversized ones are sliced into smaller chunks.
- **Three retrieval modes**:
  1. **Keyword** (TF–IDF-style, bag-of-words)
  2. **Embedding** (cosine similarity over OpenAI embeddings)
  3. **Graph** (GraphRAG-style, uses a curated knowledge graph to restrict and balance sources)
- **Embedding-based retrieval**:
  - Uses `text-embedding-3-small` (cheap OpenAI embedding model) by default.
  - Embeds each chunk **once**, caches to `data/embeddings.json`.
  - Per query: embeds the query and uses **cosine similarity** to find the closest chunks.
- **Graph-aware retrieval**:
  - Uses `data/graph_nodes.json` and `data/graph_edges.json`.
  - Selects relevant nodes based on the query (works, games, concepts, performances, etc.).
  - Expands to neighboring nodes and restricts candidate chunks to the associated works.
  - Balances results across multiple works (e.g., for questions about comparing results).
- **RAG prompt construction**:
  - Builds a `RagContext` object containing:
    - the original query  
    - top `MAX_CHUNKS_PER_QUERY` `ScoredChunk`s  
    - a stitched `contextText` with doc IDs, chunk indices, and scores
- **Generation**:
  - Calls `gpt-5-nano` (cheap chat model) by default with:
    - a system prompt (“answer using only these sources; say you don’t know if unsupported”)
    - a user message containing `Question + Sources`
- **Interactive CLI**:
  - Run `npm run dev`
  - Pick a retrieval mode
  - Type questions about the research
  - See:
    - which chunks were selected
    - the assembled “sources” context
    - the model’s grounded answer

---

## Tech Stack

- **Language:** TypeScript  
- **Runtime:** Node.js  
- **LLM provider:** OpenAI. Default models:  
  - Embeddings: `text-embedding-3-small` 
  - Chat: `gpt-5-nano`  

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

### 3. Examine project defaults and update as desired

Defaults are stored in `appConfig.ts`:
```
export const MAX_CHARS_PER_CHUNK = 1200;
export const MAX_CHUNKS_PER_QUERY = 8;
export const MIN_CHARS_FOR_RETRIEVAL = 80;
export const EMBEDDING_MODEL_NAME = "text-embedding-3-small";
export const CHAT_MODEL_NAME = "gpt-5-nano";
```
### 4. Prepare the corpus

The project expects `.txt` files in:

```text
data/corpus/
  Barriers-to-Listening.txt
  Chaos-in-the-Cosmos.txt
  ...
```

Each file becomes a `ResearchDoc` with:

- `id`: filename without `.txt` (e.g., `Barriers-to-Listening`)
- `filename`: the actual filename
- `content`: the file contents

If you want to adapt this to your own corpus, drop your `.txt` files into `data/corpus` and update `graph_nodes.json` / `graph_edges.json` to point to your own works (optional, but note that graph mode will not work without updating these files).

### 5. Run the playground

```bash
npm run dev
```

The CLI will:

1. Ask whether to enable **verbose** mode (shows more internal details).  
2. Ask you to choose a **retrieval mode**:
   - `1` → keyword
   - `2` → embedding
   - `3` → graph (default if you just press Enter)
3. Prompt you for a query:
   - Enter a question about the corpus.
   - Press Enter on an empty line to exit.

---

## Retrieval modes and sample runs

The examples below are illustrative; the exact wording of the model’s answer will vary.

### 1. Keyword mode (TF–IDF-ish)

**Best for:** simple lexical queries, or when you want to inspect DF/IDF-style behavior.

```text
Enter a search query (or press Enter to exit): Structural fog and jouissance
Querying...
=== Model answer ===
```
> Structural fog is the moments in groove-based performance (notably Phish) when players push away from the established groove and chaos or cacophony momentarily dominates. The band must still hear and track the groove “in absentia” in order to snap back into it together at the next logical point, so the fog is both a risk and a controlled theatrical device. These moments are described as being surrounded by fog, then cleared in unison as a new loop is due to begin. They are nonrandom, engineered disruptions within the improvisational dialogue that can be intensely felt by listeners. (Sources: Persistence-of-Groove, especially chunkIndex 5; and related discussion in chunks 8 and 9.)
> 
> How this connects to jouissance (the Lacanian concept):
> - Jouissance is Lacan’s term for an excessive, often painful pleasure—pleasure that exceeds the pleasure principle and can involve both enjoyment and suffering. In this framework, the fog moments contribute to a heightened experience because they push listeners beyond normal groove expectations. (Source: Source 1, chunkIndex 13; also echoed in Source 6, chunkIndex 37.)
> - A useful adaptation in this groove context is the idea of a “groove principle”: there is a temporal/quantitative limit to how much a groove can be deviated before pleasure wanes and anxiety or pain (the painful side of jouissance) sets in. Structural fog tests that limit: it can be euphoric within bounds, but excessive deviation can become painful. (Source: Source 7, chunkIndex 14; and related discussion in Source 6, chunkIndex 37.)
> - The audience’s experience often oscillates between anticipation, euphoria, and relief: moments when the fog thickens can be experienced as intense and almost overwhelming, while the fog clearing into a reasserted groove yields cathartic release. Fans describe both the ecstasy of the ride and the sharp turn toward chaos, followed by the satisfaction of the groove’s return. (Sources: Source 2, chunkIndex 5; Source 8, chunkIndex 9; Source 6, chunkIndex 37.)
> 
> Additional nuances from the sources:
> - The structural fog is not just chaos for chaos’s sake; it’s part of the improvisational conversation. Even at the most deconstructed moments, players are effectively “performing against” the groove and must be attuned to it to rejoin it at the right moment. This tension—between deconstruction and re-entry—contributes to the sense of jouissance as a combined pleasure-pain experience. (Sources: Source 2, chunkIndex 5; Source 8, chunkIndex 9; Source 3, chunkIndex 38.)
> - For some listeners, the appeal of the fog lies in the possibility that the band will surprise with a bustout or novel deviation, which heightens the sense of anticipation and makes the eventual return to the groove even more rewarding. The pleasure of “seeing through the fog” to the underlying groove is itself a source of jouissance for fans who have the context to appreciate the deviation. (Source: Source 3, chunkIndex 38.)
> 
> In short: Structural fog functions as a vehicle for jouissance in groove-based performance. It creates a tense, expectancy-filled zone between familiar groove and inventive deviation. When the band snaps back into the groove, the release can be cathartic and intensely pleasurable, but if the deviation crosses the groove-principle threshold, the experience can become painful or anxiety-provoking. This dynamic helps explain why structural fog is a signature feature of the live groove experience and a key site of its psychoanalytic appeal. (Cited concepts across Sources 1, 2, 3, 6, 7, and 8.)

You’ll see that keyword mode tends to stay within a single work and strongly favors literal matches like "jouissance" and “structural fog”.

---

### 2. Embedding mode (semantic similarity)

**Best for:** paraphrased questions and more semantic matching.

```text
Enter a search query (or press Enter to exit): What prevents players from hearing the music in World of Warcraft?
Querying...
=== Model answer ===
```
> Steven Reale describes barriers that prevent players from hearing World of Warcraft’s music in two broad categories: synchronic barriers (at a given moment in the game) and diachronic barriers (developing over patches/expansions). Here are the main ways those barriers work, with examples from the sources:
> 
> - Synchronic barriers (present at a specific time or context)
>   - Faction and location boundaries: Certain music cues are tied to a faction or to a particular place. For example, the Orgrimmar entry cue is heard by Horde players, while Alliance players may never hear it; likewise, Alliance has its own Brewfest polka, which Horde players may not hear. These create coarse synchronic barriers that can be very concrete (who you are and where you are) at a given moment. Source 4; Source 3.
>   - Zone-specific music you must physically be in: Some pieces (like Terrokar Forest music) only play in specific zones, and even in-game menus or rolls don’t always let you hear them unless you travel there. The Terrokar Forest cue does not appear on a music roll; you must travel to Outland to hear it. Source 7.
>   - Time- and activity-driven barriers (incentives push you away from listening): The game’s incentive structure pushes players toward higher-level zones and reward-rich content, which can pull attention away from listening to the score. This “coarse synchronic barrier” is created by how players are guided to play. Source 5.
>   - End-game gating and gating by progression: Some music accompanies encounters (like Kil’jaeden) that require reaching certain raid progress. If you can’t/ don’t progress to that content, you miss hearing that music. Over time, later expansions can make these encounters easier to reach (reducing the barrier for some players, but the barrier exists in earlier periods). Source 5; Source 1.
> 
> - Diachronic barriers (develop over patches/expansions)
>   - Content updates and expansion cycles: The MMORPG model of ongoing expansions creates diachronic barriers because the game is continually updated, and older music may become unavailable or relocated as content changes. For instance, The Burning Crusade added new zones and music and created a diachronic barrier to listening to older content (e.g., Silithus music). Source 1; Source 6.
>   - Music’s indeterminacy across playthroughs: Because WoW’s music can be renegotiated with each play session and patches, a score once heard may not be heard again in the same way, meaning the opportunity to hear certain pieces is inherently unstable over time. Source 2.
>   - Phase changes and housing systems changing listening access: Blizzard’s phasing and the garrison system alter what players can see/hear; even with new features like jukeboxes in garrisons, some music (like Terrokar Forest cues) isn’t fully available via simple in-game rolls and still requires traveling to certain areas. This represents a diachronic shift in how accessible music is over time. Source 7; Source 4.
> 
> - Additional nuance
>   - The score’s overall instability and renewal: Since World of Warcraft’s soundtrack is tied to a dynamic game world that is frequently revised, what can be heard and when is inherently unstable across playthroughs and updates. This is framed as a broader indeterminacy about listening opportunities in WoW. Source 2.
> 
> In short, what prevents players from hearing the music are a mix of: being in the wrong faction or location (synchronic barriers), not visiting the right zones or engaging with certain activities (synchronic barriers), and expansions/patch cycles that relocate, retire, or alter access to music (diachronic barriers). The result is that many pieces of music are accessible only to a subset of players at certain times, or may not be heard at all across a given playthrough. Source references: 2, 4, 3, 7, 1, 5, 6.

Here, the query paraphrases ("prevents players from hearing") but does not use exact phrases from the paper, and the embedding search still pulls the right chunks.

---

### 3. Graph mode (GraphRAG-style)

**Best for:** cross-work / comparative questions, conceptual questions, and queries that benefit from the curated knowledge graph (works, games, concepts, performances, etc.).

```
Enter a search query (or press Enter to exit): Provide a survey of Reale's approaches to analyzing video game music.
Querying...
=== Model answer ===
```
> Steven Reale surveys several interlocking approaches for analyzing video game music, all driven by the central problem that game scores are often dynamic, indeterminate, and ever-changing. The key strands across his work can be summarized as follows:
> 
> - Treat game music as a dynamic, indeterminate phenomenon that requires new analytic tools
>   - Reale argues that traditional music-theoretical methods—built around fixed scores played through the same way each time—need to be reworked to handle the indeterminacies of game scores. He describes analytic practice as “a space of theoretical potentialities, rather than a compendium of musical practicalities,” and calls for approaches that pair theoretical potentialities with practical musical potentialities when algorithmic systems govern continuations through moments of indeterminacy. This foundational stance recurs across his discussions of game music (Source 1; see also Source 7 and 8 for methodological framing).
> 
> - Apply and refract traditional analytic traditions to game contexts, recognizing three adapted methodologies
>   - In Analytic Traditions and Game Music, Reale explicitly notes applying three traditional analytic methodologies to a genre that is often dynamic and indeterminate. He emphasizes that these methodologies must be refracted to account for the game’s design logic, so that they can analyze music as both theoretical potentialities and practical outcomes within algorithmically guided play (Source 7). He explicitly frames this as “leveled-up” application: fixed-score theories are transformed to work with game-era music.
>   - He also foregrounds David Lewin’s functional/transformational mindset (as a touchstone) and cites Lewin’s Generalized Musical Intervals and Transformations as a toolset that can be adapted to game-music analysis (Source 8, footnote referencing Lewin; Source 1’s discussion of “space of theoretical potentialities” draws on Lewin-style thinking).
> 
> - Ground analysis in diegetic/non-diegetic and dynamic/adaptive vocabularies, with case-specific taxonomies
>   - In his Mario Galaxy case study, Reale mobilizes the diegetic/non-diegetic distinction and the dynamic vs non-dynamic spectrum (with subdivisions into adaptive vs interactive) to categorially frame how game scores function. This framing shows how music can operate inside or outside a narrative frame while also responding to player actions. The approach foregrounds the need to study how scores adapt to indeterminate player behavior (Source 2).
>   - The broader methodological stance is to show how such taxonomies—diegetic/non-diegetic and dynamic/interactive/adaptive—can be used to examine how a score is designed to respond to nondeterministic gameplay.
> 
> - Treat narrative function and filmic lineage as a productive analytic lens, especially for “music games”
>   - In Transcribing Musical Worlds, Reale asks whether certain games (e.g., L.A. Noire) function as “music games,” arguing that many video-game scores operate like film scores—designed to heighten emotion or commentary on a narrative, even as interactivity modulates when and how music is heard. He emphasizes examining how music is integrated with narrative branching and decision points rather than treating it as mere accompaniment. This narrative frame is extended by drawing on film-noir musical traditions when analyzing L.A. Noire’s score and its use within a branching, decision-driven game world (Source 3; Source 4).
>   - This approach situates game music within broader cultural and cinematic traditions, using interviews with designers and textual analysis to understand how composers and designers conceive music’s narrative function and how that function shifts when interactivity is introduced.
> 
> - Attend to diachronic and synchronic barriers to listening; the listening experience as evolving across patches and expansions
>   - Reale develops a theory of barriers to listening that tracks both synchronic moments (a moment in the game’s lifetime) and the diachronic evolution of the game through patches and expansions. He argues that because game music is frequently renewed and revised, the listening experience itself is unstable and may never be heard exactly the same way twice. This diachronic lens complements the synchronic analysis of a given moment and foregrounds how patches alter the musical texture and player experience over time (Sources 5, 6).
>   - This approach reframes listening as something that can only be understood across the life of the game, not just in a single, fixed moment.
> 
> - Integrate ethnographic and design-informed methods, including interviews with creators
>   - Reale supplements music-analytic work with designer interviews to illuminate why certain musical approaches were chosen and how designers think about categorization (e.g., whether a work is a “music game”). In his L.A. Noire discussions, he and others debate the very categorization of works as music games, illustrating how design decisions shape musical analysis and how the analysis must respond to those decisions (Source 4).
>   - This ethnographic dimension—gathering designer perspectives—helps calibrate analytic priorities (e.g., narrative function, interaction models) and grounds theory in actual development practice.
> 
> - Position game music within improvised and uncertain musical practices
>   - A recurring claim in Reale’s work is that the indeterminate, algorithmically guided nature of game music aligns it with improvised musical practices. He argues that the indeterminate dimension of gameplay invites analytic tools from improvised and contemporary musics and that music theories can be “leveled up” or refracted to illuminate this convergence (Source 7). This position positions game music not as a failure of canonical score analysis but as a site where improvisational logics and real-time musical continuations can be studied alongside traditional notated practice.
> 
> - Outcome and aims: a plural, adaptable toolkit for game-music analysis
>   - Across these strands, Reale’s survey of approaches yields a pragmatic, plural toolkit: combine theoretical potentialities with practical continuations; use diegetic/non-diegetic and dynamic/adaptive taxonomies; read music through narrative and film-noir lineage when appropriate; track listening across synchronic moments and diachronic patches; supplement analysis with designer testimony; and recognize the improvised, uncertain, and evolving character of game scores. The overall aim is to broaden music-theoretical practice so it can handle the dynamic, algorithmically governed, and narratively braided nature of video game music (Sources 1, 2, 3, 4, 5, 6, 7, 8).
> 
> Notes on scope and naming
> - Reale explicitly references three methodologies used in Analytic Traditions and Game Music, but the provided excerpts do not name them in a way that can be quoted verbatim here. He signals that these methodologies must be refracted for game contexts and that traditional tools (notably Lewin’s transformational approach) provide a foundation to be adapted (Sources 7, 8; see also Source 1).
> - The Mario Galaxy case study and the L.A. Noire discussion are concrete instantiations of these aims: using established analytic vocabularies to describe game-specific phenomena, and using narrative and filmic lineage to interpret music’s function within interactive media (Sources 2, 3, 4).
> 
> If you’d like, I can pull out specific passages that illustrate each of these approaches or map particular case-study findings onto the broader methodological themes above.

Graph mode uses the knowledge graph to:

- Pull in the relevant **works** linked to video game analysis.
- Expand through related concepts.
- Restrict the embedding search to chunks from those works.
- Balance the final context across them, which helps the model actually *compare* instead of just answering from one paper.

---

## Project structure

```text
data/
  corpus/                # Plain-text exports of the research articles
    Barriers-to-Listening.txt
    Chaos-in-the-Cosmos.txt
    ...
  auto-generated/
    embeddings.json        # Cached chunk embeddings (auto-generated)
  graph_nodes.json       # Knowledge graph nodes (works, games, concepts, etc.)
  graph_edges.json       # Knowledge graph edges (relations between nodes)

src/
  cli/
    console.ts           # CLI prompts and verbose debug output

  library/
    queryUtils.ts        # Query tokenization and stopword handling
    textUtils.ts         # Helpers for text preview and whitespace normalization
    types.ts             # Core types (ResearchDoc, Chunk, ScoredChunk, EmbeddedChunk, RagContext)    

  model/
    corpus.ts            # Load and chunk the research articles
    knowledgeGraph.ts    # Load the knowledge graph from JSON

  openai/
    embeddings.ts        # OpenAI embedding calls + caching helpers
    generation.ts        # OpenAI chat completions for answer generation

  pipelines/
    buildContextText.ts  # Helper pipeline function   
    flatRagPipeline.ts   # Baseline RAG (keyword + embedding modes)
    graphRagPipeline.ts  # Graph-aware RAG (GraphRAG-style pipeline)

  retrieval/
    embeddingRetrieval.ts# Cosine similarity search over embedded chunks + cache
    keywordRetrieval.ts  # TF–IDF-style keyword search over chunks
  
  appConfig.ts           # Global application settings
  index.ts               # Main entrypoint; wires modes, pipelines, and I/O together
```

## Note on LLM usage / provenance

I approached this as a learning project: the aim was to deeply understand RAG and GraphRAG, not just “vibe-code” something that happens to work.

To that end, I **pair-programmed** most of this with ChatGPT:

- I wrote and refactored the code iteratively.
- ChatGPT provided suggestions for architecture, algorithms (cosine similarity, TF–IDF, graph selection), and TypeScript ergonomics.
- I pushed back frequently, changed its suggestions for style/readability/UX, and made sure I could explain each piece (e.g., cosine similarity, TF–IDF weighting, graph expansion, chunking strategy).

You can see the full provenance here:

- [Complete conversation log for building this project](https://chatgpt.com/share/69177719-481c-8010-9915-de852a98db86)

Some useful search strings within that log if you want to jump around:

- “Let’s also think high-level structure here.”
- “Why aren’t we defining ScoredChunk in types?”
- “I see. So we’re using OpenAI for two things:”
- “I think I’d also like to keep the vanilla RAG implementation in the project.”
- “From the standpoint of user workflow,”
- “I’m skeptical of the bag of keywords approach.”
- “What is ‘TF–IDF’?”
- “Wonderful. OK, time to work on index.ts again, to implement method selection.”
- “Great: here is some sample output. Can we talk through how to make sense of the df and idf rankings?”
- “This is interesting, and really highlights the limitations of baseline RAG:”

Additional side-conversations:

- [Cosine similarity refresher](https://chatgpt.com/share/691652ea-d424-8010-aacc-93cadf0d5de0)
- [Corpus analysis and graph-structure design](https://chatgpt.com/share/69179671-620c-8010-8508-4d08ea9550d4)
- [Code review thread](https://chatgpt.com/share/691a834b-219c-8010-9a3f-919e729969f0)

---

## Limitations and future work

- This is a **learning playground**, not a production system.
- The knowledge graph is currently bespoke to my own corpus; adapting it to another domain would require:
  - New `.txt` documents in `data/corpus/`.
  - New `graph_nodes.json` / `graph_edges.json` describing that domain.
- Future directions I’m considering:
  - More robust embedding cache invalidation.
  - Better handling of multi-hop graph expansion.
  - Experimenting with reranking / answer grading on top of the current retrieval.
