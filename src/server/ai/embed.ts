import { embed } from "ai";
import type { AiProviderConfig, Entry, PrismaClient } from "@prisma/client";
import { getUserEmbedModel } from "./provider";
import { db } from "@/server/db";

export async function generateEmbedding(
  config: AiProviderConfig,
  entry: Pick<Entry, "id" | "title" | "content">
) {
  const model = getUserEmbedModel(config);
  const text = `${entry.title}\n${entry.content}`;

  const { embedding } = await embed({ model, value: text });

  // Store via raw SQL (pgvector)
  const vectorStr = `[${embedding.join(",")}]`;
  await db.$executeRawUnsafe(
    `UPDATE "Entry" SET "embedding" = $1::vector WHERE "id" = $2`,
    vectorStr,
    entry.id
  );

  return embedding;
}

export async function findSimilarEntries(
  prisma: any,
  entryId: string,
  userId: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<Array<{ id: string; title: string; content: string; similarity: number }>> {
  const results = await prisma.$queryRawUnsafe(
    `SELECT e."id", e."title", e."content",
            1 - (e."embedding" <=> (SELECT "embedding" FROM "Entry" WHERE "id" = $1)) as similarity
     FROM "Entry" e
     WHERE e."userId" = $2
       AND e."id" != $1
       AND e."embedding" IS NOT NULL
     ORDER BY e."embedding" <=> (SELECT "embedding" FROM "Entry" WHERE "id" = $1)
     LIMIT $3`,
    entryId,
    userId,
    limit
  );

  return (results as any[]).filter((r: any) => r.similarity >= threshold);
}
