import { generateObject } from "ai";
import { z } from "zod";
import type { AiProviderConfig } from "@prisma/client";
import { getUserTextModel } from "./provider";

const titleSchema = z.object({
  title: z.string().max(200),
});

export async function generateTitle(
  config: AiProviderConfig,
  content: string
): Promise<string> {
  const model = getUserTextModel(config);
  const { object } = await generateObject({
    model,
    schema: titleSchema,
    prompt: `Generate a concise, summarized title (max 6 words) for this note. The title should be a clean, descriptive headline — NOT a copy of the input. Distill the core topic into a brief label.\n\nNote: ${content.slice(0, 2000)}`,
  });
  return object.title;
}
