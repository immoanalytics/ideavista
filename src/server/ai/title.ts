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
    prompt: `Generate a short, descriptive title (max 10 words) for this content. The title should capture the core topic.\n\nContent: ${content.slice(0, 2000)}`,
  });
  return object.title;
}
