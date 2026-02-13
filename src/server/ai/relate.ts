import { generateText } from "ai";
import type { AiProviderConfig, Entry } from "@prisma/client";
import { getUserTextModel } from "./provider";
import { RELATIONSHIP_PROMPT } from "./prompts";
import { RELATIONSHIP_TYPES } from "@/lib/constants";

export async function detectRelationships(
  config: AiProviderConfig,
  prisma: any,
  entry: Pick<Entry, "id" | "title" | "content">,
  similarEntries: Array<{ id: string; title: string; content: string; similarity: number }>
) {
  const model = getUserTextModel(config);

  for (const similar of similarEntries) {
    // Get relationship label from LLM
    let relationship = "related_to";
    try {
      const prompt = RELATIONSHIP_PROMPT
        .replace("{titleA}", entry.title)
        .replace("{contentA}", entry.content.slice(0, 500))
        .replace("{titleB}", similar.title)
        .replace("{contentB}", similar.content.slice(0, 500));

      const { text } = await generateText({ model, prompt });
      const cleaned = text.trim().toLowerCase().replace(/[^a-z_]/g, "");
      if (RELATIONSHIP_TYPES.includes(cleaned as any)) {
        relationship = cleaned;
      }
    } catch {
      // Fall back to "related_to"
    }

    // Upsert edge
    await prisma.entryEdge.upsert({
      where: {
        sourceId_targetId: {
          sourceId: entry.id,
          targetId: similar.id,
        },
      },
      update: { strength: similar.similarity, relationship },
      create: {
        sourceId: entry.id,
        targetId: similar.id,
        relationship,
        strength: similar.similarity,
        isAiGenerated: true,
      },
    });
  }
}
