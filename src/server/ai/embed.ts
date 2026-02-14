import { embed } from "ai";
import type { AiProviderConfig, Entry } from "@prisma/client";
import { getUserEmbedModel } from "./provider";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function generateEmbedding(
  config: AiProviderConfig,
  entry: Pick<Entry, "id" | "title" | "content">,
  prisma: any
) {
  const model = getUserEmbedModel(config);
  const text = `${entry.title}\n${entry.content}`;

  const { embedding } = await embed({ model, value: text });

  // Store as JSON string
  await prisma.entry.update({
    where: { id: entry.id },
    data: { embedding: JSON.stringify(embedding) },
  });

  return embedding;
}

export async function findSimilarEntries(
  prisma: any,
  entryId: string,
  userId: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<Array<{ id: string; title: string; content: string; similarity: number }>> {
  // Get the source entry's embedding
  const source = await prisma.entry.findUnique({
    where: { id: entryId },
    select: { embedding: true },
  });

  if (!source?.embedding) return [];

  const sourceEmbedding: number[] = JSON.parse(source.embedding);

  // Get all other entries with embeddings for this user
  const candidates = await prisma.entry.findMany({
    where: {
      userId,
      id: { not: entryId },
      embedding: { not: null },
    },
    select: { id: true, title: true, content: true, embedding: true },
  });

  // Compute cosine similarity in JS
  const results = candidates
    .map((c: any) => {
      const sim = cosineSimilarity(sourceEmbedding, JSON.parse(c.embedding));
      return { id: c.id, title: c.title, content: c.content, similarity: sim };
    })
    .filter((r: any) => r.similarity >= threshold)
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, limit);

  return results;
}
