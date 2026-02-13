import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { AiProviderConfig } from "@prisma/client";
import { decrypt } from "@/server/services/encryption";

const providerFactories = {
  OPENAI: (apiKey: string) => createOpenAI({ apiKey }),
  ANTHROPIC: (apiKey: string) => createAnthropic({ apiKey }),
  GOOGLE: (apiKey: string) => createGoogleGenerativeAI({ apiKey }),
} as const;

export function getUserProvider(config: AiProviderConfig) {
  const apiKey = decrypt(config.apiKey);
  const factory = providerFactories[config.provider];
  if (!factory) throw new Error(`Unsupported provider: ${config.provider}`);
  return factory(apiKey);
}

export function getUserTextModel(config: AiProviderConfig) {
  const provider = getUserProvider(config);
  return provider(config.model);
}

export function getUserEmbedModel(config: AiProviderConfig) {
  const provider = getUserProvider(config);
  return provider.textEmbeddingModel(config.embedModel);
}
