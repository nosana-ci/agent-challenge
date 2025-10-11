import { createOpenAI } from "@ai-sdk/openai";

// Configure OpenAI provider with OpenRouter
const openaiProvider = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Use a supported model - gpt-4o-mini is supported by Mastra and cost-effective
export const openaiModel = openaiProvider("openai/gpt-4o-mini");
