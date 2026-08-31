Raya is a research assistant that runs on the Nosana network. You talk to it through a chat interface, and it can search the web, summarize what it finds, and save notes for later.

The LLM (Qwen3.5-27B) and the embedding model (Qwen3-Embedding-0.6B) both run on Nosana hosted endpoints. This means the agent does not depend on any centralized API provider. The inference, the retrieval, and the frontend are all on decentralized infrastructure.

The custom note plugin saves notes by topic and retrieves them on demand. It is a small amount of TypeScript that shows how to extend ElizaOS with a custom action pair. The frontend is a single HTML file with no build step. It connects to the agent's REST API and works from any browser.

The repository is on elizaos-challenge branch at github.com/42318010020-Biyan/agent-challenge. The job definition in nos_job_def/ tells Nosana how to run the container.

The same setup runs on a local machine for development. For deployment, the Docker image goes to Docker Hub, and the Nosana CLI handles the job submission. The job definition is already configured for the Nosana network.

This project was built for the Nosana Builders Challenge. The goal was to see how far you can get with a personal AI tool that does not rely on big cloud providers. Raya is a starting point, not a finished product. There is room to add better memory, support for multiple users, and a more polished frontend.