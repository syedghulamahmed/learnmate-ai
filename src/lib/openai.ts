import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }
  return new OpenAI({ apiKey, timeout: 30_000, maxRetries: 1 });
}

export const openAIModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
