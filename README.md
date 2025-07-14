# 🛰️ Solana Monitor Agent

A custom AI agent built with the [Mastra framework](https://github.com/mastra-ai/mastra) to monitor a Solana wallet in real-time, detect new transactions, and provide human-readable summaries of wallet activity.

> 🛠️ Built for the [Nosana Agent Challenge](https://github.com/nosana-ci/agent-challenge)

---

## 🧠 What It Does

This agent watches a Solana wallet address and periodically polls for new transactions. When it finds activity, it uses a local language model (via Ollama) to summarize and explain:

- SOL and SPL token transfers
- Smart contract interactions
- Transaction counts and amounts
- Any visible time-based patterns

---

## 🧪 Example Usage

Input:

```json
{
  "walletAddress": "YourSolanaWalletAddressHere",
  "lastKnownSignature": "optional_signature_here",
  "pollIntervalSeconds": 15,
  "maxAttempts": 10
}
```
