# Raya: personal research companion

A small AI assistant that helps with research, note-taking, and looking things up. It runs on the Nosana network, a decentralized GPU platform, using Qwen3.5-27B for text generation and Qwen3 Embeddings for memory.

Built with ElizaOS for the Nosana Builders Challenge.

## What it does

Raya is not a general chatbot. It focuses on a few things:

- **Web search.** Ask it to look something up and it will search and summarize.
- **Note-taking.** You can say "save note groceries : milk and eggs" and it will remember. Ask "get notes" later to see what you saved.
- **Research summaries.** Paste a link or a block of text and it will condense it.

There is a custom plugin in `src/index.ts` that handles the note-taking part. It is a simple in-memory store. For anything more permanent, you would want to back it with SQLite, which ElizaOS already sets up.

## Files

```
characters/agent.character.json    personality and behavior
src/index.ts                       custom note-taking plugin
frontend/index.html                chat UI
nos_job_def/                       deployment config for Nosana
Dockerfile                         container setup
.env.example                       environment template
```

## Setting it up locally

You need Node.js 23 and pnpm.

```bash
pnpm install
cp .env.example .env
# edit .env if needed
pnpm dev
```

Open http://localhost:3000 in a browser. The page includes a simple chat interface. If you are running the agent locally, it connects to the default endpoint. If you deployed on Nosana, add `?endpoint=<your-nosana-url>` to the URL.

## Deploying on Nosana

The challenge requires agents to run on Nosana infrastructure. You can use the free builders credits for this.

1. Build the Docker image and push it to Docker Hub (make it public).
2. Edit `nos_job_def/nosana_eliza_job_definition.json` and set the image field to your image.
3. Go to the Nosana dashboard, paste the job definition, and deploy.

The job definition uses both the Nosana LLM endpoint and the embedding endpoint. This means the agent does not depend on any outside provider.

## The character

The character file defines Raya as a straightforward research assistant. It avoids being overly chatty or enthusiastic. The ElizOS framework lets you change the personality, plugins, and behavior just by editing that one JSON file.

## The frontend

The frontend is a single HTML file in `frontend/`. Dark theme, minimal, one input box and a chat log. It sends messages to the agent's REST API. You can point it at any running instance by passing the `?endpoint=` parameter.

## Builders credits

Participants get free compute credits to run their agents. Go to nosana.com/builders-credits and submit this repo link. Credits are airdropped twice a day.

## License

MIT. Same as the original template.