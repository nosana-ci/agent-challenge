import { createOpenAI } from "@ai-sdk/openai";

console.log(
  "🔑 OpenRouter API Key available:",
  !!process.env.OPENROUTER_API_KEY
);
console.log(
  "🔑 API Key preview:",
  process.env.OPENROUTER_API_KEY?.substring(0, 10) + "..."
);

// Configure OpenAI provider with OpenRouter
const openaiProvider = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Use gpt-4o-mini - it's fast, cost-effective, and has good streaming support
// Note: If you experience issues, try switching to "openai/gpt-3.5-turbo" or "anthropic/claude-3-5-haiku"
export const openaiModel = openaiProvider("openai/gpt-4o-mini");
