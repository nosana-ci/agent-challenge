# FoundersClaw

FoundersClaw is the challenge-fork version of ClawFounder: an AI Chief of Staff for crypto founders built on ElizaOS and prepared for Nosana deployment.

It monitors:
- GitHub execution
- treasury wallet activity
- token pricing
- Telegram community activity

Then it generates a concise `ClawFounder Daily Brief` and can send it directly to Telegram.

## Why this repo now fits the challenge

This repository is based on the official Nosana x ElizaOS Agent Challenge fork and uses the challenge starter structure:
- ElizaOS plugin entrypoint in [src/index.ts](/home/badman/Projects/clawfounder/src/index.ts)
- character definition in [agent.character.json](/home/badman/Projects/clawfounder/characters/agent.character.json)
- Nosana job definition in [nosana_eliza_job_definition.json](/home/badman/Projects/clawfounder/nos_job_def/nosana_eliza_job_definition.json)
- Node.js 23-based container in [Dockerfile](/home/badman/Projects/clawfounder/Dockerfile)

The Python backend remains in the repo because it already contains working live integrations for GitHub, Alchemy, CoinGecko, and Telegram. The ElizaOS layer calls that backend through [backend_cli.py](/home/badman/Projects/clawfounder/backend_cli.py).

## Architecture

```text
ElizaOS Character + Plugin
        |
        v
   src/index.ts
        |
        v
   backend_cli.py
        |
        v
ClawFounder Python Agent
        |
        +--> GitHub API
        +--> Alchemy
        +--> CoinGecko
        +--> Telegram Bot API
        |
        v
Daily Founder Brief -> Telegram
```

## Key files

- [src/index.ts](/home/badman/Projects/clawfounder/src/index.ts): ElizaOS plugin entrypoint
- [agent.character.json](/home/badman/Projects/clawfounder/characters/agent.character.json): ClawFounder identity and system prompt
- [clawfounder_agent.py](/home/badman/Projects/clawfounder/agent/clawfounder_agent.py): Python orchestration layer
- [tools_registry.py](/home/badman/Projects/clawfounder/agent/tools_registry.py): registered backend tools
- [main.py](/home/badman/Projects/clawfounder/main.py): manual runs, scheduler, connection tests
- [daily_job.py](/home/badman/Projects/clawfounder/scheduler/daily_job.py): daily execution loop
- [nosana_eliza_job_definition.json](/home/badman/Projects/clawfounder/nos_job_def/nosana_eliza_job_definition.json): Nosana deployment config

## Environment setup

Copy [`.env.example`](/home/badman/Projects/clawfounder/.env.example) to `.env` and fill in:

- `OPENAI_API_KEY`
- `OPENAI_API_URL`
- `MODEL_NAME`
- `CLAWFOUNDER_GITHUB_REPO`
- `CLAWFOUNDER_GITHUB_TOKEN`
- `CLAWFOUNDER_WALLET_ADDRESS`
- `CLAWFOUNDER_ALCHEMY_API_KEY`
- `CLAWFOUNDER_TELEGRAM_BOT_TOKEN`
- `CLAWFOUNDER_TELEGRAM_CHAT_ID`
- `CLAWFOUNDER_PRICE_TOKEN_ID`

## Local development

Install JavaScript dependencies:

```bash
pnpm install
```

Install Python dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the ElizaOS agent:

```bash
pnpm dev
```

Run the Python daily brief manually:

```bash
python3 main.py --mode run-once --send
```

Run provider connection tests:

```bash
python3 main.py --mode test-connections
```

Run the demo script:

```bash
python3 demo.py
```

## Daily brief format

```text
ClawFounder Daily Brief — [DATE]

Code Activity
- Commits: X
- PRs: X
- Issues: X

Treasury
- Balance: $X
- Largest Tx: $X

Community
- Messages: X
- Sentiment: X

Alerts
- Any unusual activity
```

## Nosana deployment

Build the image:

```bash
docker build -t wuododhis/foundersclaw:latest .
```

Push it:

```bash
docker push wuododhis/foundersclaw:latest
```

Then update and use [nosana_eliza_job_definition.json](/home/badman/Projects/clawfounder/nos_job_def/nosana_eliza_job_definition.json) in the Nosana dashboard.

## Current status

Already in place:
- challenge fork base
- ElizaOS starter structure
- live GitHub, wallet, price, and Telegram integrations
- Telegram delivery
- daily briefing generation
- Docker and Nosana deployment scaffolding

Still recommended before final submission:
- add a small custom UI beyond the built-in Eliza client
- validate the full `pnpm dev` Eliza path locally
- deploy on Nosana and capture the live URL
- record the demo video
