import { generateText } from "ai";
import type { AiProviderConfig } from "@prisma/client";
import { getUserTextModel } from "./provider";

export async function summarizeEntry(
  config: AiProviderConfig,
  title: string,
  content: string
): Promise<string> {
  const model = getUserTextModel(config);
  const { text } = await generateText({
    model,
    prompt: `Summarize the following entry in 1-2 concise sentences:\n\nTitle: ${title}\nContent: ${content}`,
  });
  return text.trim();
}
