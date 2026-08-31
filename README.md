# Raya: personal research companion

A small AI assistant that helps you research things, keep notes, and come back to them later. It runs on the Nosana network, a marketplace where people rent out GPU time, so the model and the embedding model both run on someone else's hardware instead of yours.

## What it does

Raya is built for the kind of work where you open ten tabs, read half of them, and lose the useful bits. You can ask it to look something up, drop a note in the chat, and pull that note back out whenever you need it. The web search plugin finds sources, the note plugin keeps the details, and the whole thing answers through a chat window.

The agent runs on Qwen3.5-27B through the Nosana hosted inference endpoint. Embeddings use Qwen3-Embedding-0.6B on the same network. That means the LLM and the retrieval model are both decentralized, which is the point of the challenge.

## Files

- `characters/agent.character.json` — the agent persona: who Raya is, how it talks, when it stays quiet
- `src/index.ts` — a small custom plugin for saving and retrieving notes in the session
- `frontend/index.html` — a single-file chat UI you can open anywhere, points at the agent's REST API
- `nos_job_def/nosana_eliza_job_definition.json` — the job definition that tells Nosana how to run the container
- `Dockerfile` — builds the agent image

## Setting it up locally

```bash
git clone https://github.com/42318010020-Biyan/agent-challenge
cd agent-challenge
cp .env.example .env
# edit .env if needed
bun install
bun run start
```

Open http://localhost:3000 and you can talk to Raya directly.

## Deploying on Nosana

1. Build the image and push it to Docker Hub (must be public):

```bash
docker build -t 42318010020Biyan/raya-eliza-agent:latest .
docker login
docker push 42318010020Biyan/raya-eliza-agent:latest
```

2. Update `nos_job_def/nosana_eliza_job_definition.json` if your image tag differs, then deploy with the Nosana CLI:

```bash
nosana job deploy nos_job_def/nosana_eliza_job_definition.json
```

3. The job prints a public URL. Point the frontend at it.

## The character

Raya keeps answers short unless you ask for detail. It says so when it does not know something. It saves notes when you tell it to and retrieves them when you ask. The tone is plain and direct, not chatty.

## The frontend

`frontend/index.html` is a single file, no build step. It reads the agent URL from the `?agent=` query param and falls back to `http://localhost:3000`. Open it in a browser and you get a basic chat box.

## Builders credits

This project was built for the Nosana Builders Challenge. The same repo link is what you submit on the builders-credits page to get free compute credits. Credits are airdropped twice a day after submission.

## License

MIT. See `LICENSE`.
