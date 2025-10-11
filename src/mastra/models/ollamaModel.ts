import { createOpenAI } from "@ai-sdk/openai";

// Create Ollama provider using OpenAI-compatible API
const ollama = createOpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama", // Ollama doesn't require a real API key
});

// Use the llama3.2:3b model
export const ollamaModel = ollama("llama3.2:3b");
