import OpenAI from "openai";

export function getOpenAIClient(oidcToken?: string) {
  const apiKey = process.env.VERCEL_OIDC_TOKEN || oidcToken || process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error("Vercel AI Gateway credentials are unavailable.");
  }
  return new OpenAI({ apiKey, baseURL: "https://ai-gateway.vercel.sh/v1", timeout: 30_000, maxRetries: 1 });
}

export const openAIModel = process.env.AI_GATEWAY_MODEL || "openai/gpt-4.1-mini";
