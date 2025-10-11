import { createOpenAI } from "@ai-sdk/openai";

// Create OpenRouter client using OpenAI-compatible interface
const openRouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "sk-test",
  baseURL: "https://openrouter.ai/api/v1",
});

// Use free Mistral model during development
export const openRouterModel = openRouter("mistralai/mistral-7b-instruct:free");

// Alternative models (uncomment as needed):
// export const openRouterModel = openRouter("qwen/qwen-2.5-7b-instruct:free"); // Alternative free model
// export const openRouterModel = openRouter("openai/gpt-4o"); // For production/demos (paid)
