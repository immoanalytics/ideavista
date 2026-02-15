import { z } from "zod";
import { createRouter, protectedProcedure } from "../init";
import { createEntrySchema, updateEntrySchema } from "@/lib/validators";
import { generateTitle } from "@/server/ai/title";
import { extractUrlMetadata } from "@/server/ai/metadata";
import { categorizeEntry } from "@/server/ai/categorize";
import { generateEmbedding, findSimilarEntries } from "@/server/ai/embed";
import { detectRelationships } from "@/server/ai/relate";
import type { AiProviderConfig, Entry } from "@prisma/client";

/* ── Keyword-based fallback categorizer (no AI needed) ── */

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Trips: [
    "trip", "travel", "flight", "hotel", "airbnb", "booking", "airline",
    "airport", "destination", "vacation", "holiday", "ticket", "resort",
    "hostel", "itinerary", "passport", "luggage", "suitcase", "cruise",
    "bus", "train", "rental", "car hire", "slovenia", "malta", "paris",
    "london", "rome", "barcelona", "tokyo", "beach", "mountain", "hiking",
    "restaurant", "menu", "reservation", "ryanair", "easyjet", "maps",
    "google maps", "pin", "location",
  ],
  Entertainment: [
    "movie", "film", "watch", "netflix", "hbo", "disney", "paramount",
    "series", "show", "episode", "season", "trailer", "cinema", "theatre",
    "concert", "music", "album", "song", "spotify", "youtube", "podcast",
    "game", "gaming", "playstation", "xbox", "nintendo", "steam",
    "watchlist", "silo", "red alert", "karpathy",
  ],
  "To Read": [
    "read", "article", "blog", "post", "book", "paper", "tutorial",
    "guide", "documentation", "docs", "link", "url", "http", "https",
    "reference", "bookmark", "save for later", "try later", "check out",
    "look into", "research", "learn", "course", "study", "medium",
    "substack", "newsletter", "pdf", "ebook",
  ],
};

function fallbackCategorize(text: string): {
  categoryName: "Trips" | "Entertainment" | "To Read" | "Other";
  summary: string;
} {
  const lower = text.toLowerCase();
  let bestCategory: "Trips" | "Entertainment" | "To Read" | "Other" = "Other";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as any;
    }
  }

  const summary = text.slice(0, 120).replace(/\n/g, " ").trim() +
    (text.length > 120 ? "…" : "");

  return { categoryName: bestCategory, summary };
}

async function fallbackProcessEntry(
  db: any,
  entry: Pick<Entry, "id" | "title" | "content">,
) {
  try {
    const { categoryName, summary } = fallbackCategorize(
      `${entry.title} ${entry.content}`
    );

    const category = await db.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    await db.entry.update({
      where: { id: entry.id },
      data: {
        summary,
        aiCategoryId: category.id,
      },
    });
  } catch (e) {
    console.warn("Fallback categorization failed:", entry.id, e);
  }
}

async function processEntryPipeline(
  db: any,
  config: AiProviderConfig,
  entry: Pick<Entry, "id" | "title" | "content">,
  userId: string
) {
  try {
    const categorization = await categorizeEntry(config, entry);

    let categoryId: string | undefined;
    if (categorization.categoryName) {
      const category = await db.category.upsert({
        where: { name: categorization.categoryName },
        update: {},
        create: {
          name: categorization.categoryName,
        },
      });
      categoryId = category.id;
    }

    // Merge imageKeyword into existing metadata
    const existing = await db.entry.findUnique({
      where: { id: entry.id },
      select: { metadata: true },
    });
    const prevMeta = (existing?.metadata as any) ?? {};
    const updatedMeta = {
      ...prevMeta,
      ...(categorization.imageKeyword
        ? { imageKeyword: categorization.imageKeyword }
        : {}),
    };

    await db.entry.update({
      where: { id: entry.id },
      data: {
        type: categorization.type as any,
        summary: categorization.summary,
        aiCategoryId: categoryId,
        metadata:
          Object.keys(updatedMeta).length > 0
            ? JSON.parse(JSON.stringify(updatedMeta))
            : undefined,
      },
    });

    if (categorization.tags?.length) {
      for (const tagName of categorization.tags) {
        const tag = await db.tag.upsert({
          where: { name_userId: { name: tagName, userId } },
          update: {},
          create: { name: tagName, userId },
        });
        await db.entryTag.upsert({
          where: { entryId_tagId: { entryId: entry.id, tagId: tag.id } },
          update: {},
          create: { entryId: entry.id, tagId: tag.id, isAiGenerated: true },
        });
      }
    }

    try {
      await generateEmbedding(config, entry, db);
      const similar = await findSimilarEntries(db, entry.id, userId);
      if (similar.length > 0) {
        await detectRelationships(config, db, entry, similar);
      }
    } catch (e) {
      console.warn("Embedding/relationship detection skipped:", e);
    }
  } catch (e) {
    console.warn("AI processing failed for entry:", entry.id, e);
  }
}

export const entryRouter = createRouter({
  list: protectedProcedure
    .input(
      z.object({
        type: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const entries = await ctx.db.entry.findMany({
          where: {
            userId: ctx.userId,
            ...(input.type && input.type !== "all" ? { type: input.type as any } : {}),
            ...(input.search
              ? {
                  OR: [
                    { title: { contains: input.search, mode: "insensitive" as const } },
                    { content: { contains: input.search, mode: "insensitive" as const } },
                  ],
                }
              : {}),
          },
          include: {
            aiCategory: true,
            tags: { include: { tag: true } },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit + 1,
          ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        });

        let nextCursor: string | undefined;
        if (entries.length > input.limit) {
          const next = entries.pop();
          nextCursor = next?.id;
        }

        return { entries, nextCursor };
      } catch {
        return { entries: [], nextCursor: undefined };
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const entry = await ctx.db.entry.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: {
          aiCategory: true,
          tags: { include: { tag: true } },
          collections: { include: { collection: true } },
          edgesFrom: { include: { target: true } },
          edgesTo: { include: { source: true } },
        },
      });
      if (!entry) throw new Error("Entry not found");
      return entry;
    }),

  create: protectedProcedure
    .input(createEntrySchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Resolve title
      let title = input.title;
      const config = await ctx.db.aiProviderConfig.findUnique({
        where: { userId: ctx.userId },
      });

      if (!title && config) {
        try {
          title = await generateTitle(config, input.content);
        } catch {
          // fallback below
        }
      }
      if (!title) {
        title =
          input.content.slice(0, 80).replace(/\n/g, " ").trim() +
          (input.content.length > 80 ? "..." : "");
      }

      // 2. Extract URL metadata
      let metadata = input.metadata ?? {};
      try {
        const urlMetadata = await extractUrlMetadata(input.content);
        if (urlMetadata.length > 0) {
          metadata = { ...metadata, urls: urlMetadata };
        }
      } catch {
        // URL extraction is best-effort
      }

      // 3. Create entry
      const entry = await ctx.db.entry.create({
        data: {
          title,
          content: input.content,
          type: input.type,
          userId: ctx.userId,
          metadata:
            Object.keys(metadata).length > 0
              ? JSON.parse(JSON.stringify(metadata))
              : undefined,
        },
      });

      // 4. Fire-and-forget AI processing (or keyword fallback)
      if (config) {
        processEntryPipeline(ctx.db, config, entry, ctx.userId).catch(() => {});
      } else {
        fallbackProcessEntry(ctx.db, entry).catch(() => {});
      }

      return entry;
    }),

  update: protectedProcedure
    .input(updateEntrySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const entry = await ctx.db.entry.update({
        where: { id, userId: ctx.userId },
        data: {
          title: data.title,
          content: data.content,
          type: data.type,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
        },
      });
      return entry;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.entry.delete({
        where: { id: input.id, userId: ctx.userId },
      });
      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const counts = await ctx.db.entry.groupBy({
        by: ["type"],
        where: { userId: ctx.userId },
        _count: true,
      });
      const total = counts.reduce((sum, c) => sum + c._count, 0);
      return { total, byType: counts };
    } catch {
      return { total: 0, byType: [] };
    }
  }),
});
