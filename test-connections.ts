#!/usr/bin/env tsx
import "dotenv/config";

console.log("🧪 Testing OpenRouter API connection...");
console.log(
  "API Key:",
  process.env.OPENROUTER_API_KEY ? "Set ✅" : "Missing ❌"
);

async function testOpenRouter() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log("✅ OpenRouter API connection successful!");
      const data = await response.json();
      console.log(`📊 Available models: ${data.data?.length || 0}`);
    } else {
      console.error(
        "❌ OpenRouter API connection failed:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error("❌ OpenRouter API test error:", error);
  }
}

async function testOllamaConnection() {
  try {
    const ollamaUrl =
      process.env.NOS_OLLAMA_API_URL || process.env.OLLAMA_API_URL;
    console.log(`🧪 Testing Ollama connection to: ${ollamaUrl}`);

    const response = await fetch(`${ollamaUrl?.replace("/api", "")}/api/tags`);

    if (response.ok) {
      console.log("✅ Ollama connection successful!");
      const data = await response.json();
      console.log(`📊 Available models: ${data.models?.length || 0}`);
    } else {
      console.error(
        "❌ Ollama connection failed:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error("❌ Ollama test error:", error);
  }
}

testOpenRouter();
testOllamaConnection();
