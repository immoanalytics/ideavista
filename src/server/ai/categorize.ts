import { generateObject } from "ai";
import { z } from "zod";
import type { AiProviderConfig, Entry } from "@prisma/client";
import { getUserTextModel } from "./provider";
import { CATEGORIZE_PROMPT } from "./prompts";

const categorizationSchema = z.object({
  type: z.enum(["NOTE", "IDEA", "REMINDER", "TRIP", "TASK", "BOOKMARK", "JOURNAL"]),
  categoryName: z.string(),
  categoryColor: z.string().optional(),
  tags: z.array(z.string()).max(5),
  summary: z.string(),
  imageKeyword: z.string().optional(),
});

export async function categorizeEntry(
  config: AiProviderConfig,
  entry: Pick<Entry, "title" | "content">
) {
  const model = getUserTextModel(config);
  const prompt = CATEGORIZE_PROMPT
    .replace("{title}", entry.title)
    .replace("{content}", entry.content);

  const { object } = await generateObject({
    model,
    schema: categorizationSchema,
    prompt,
  });

  return object;
}
