import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, protectedProcedure } from "../init";
import { categorizeEntry } from "@/server/ai/categorize";
import { generateEmbedding, findSimilarEntries } from "@/server/ai/embed";
import { detectRelationships } from "@/server/ai/relate";

export const aiRouter = createRouter({
  processEntry: protectedProcedure
    .input(z.object({ entryId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const config = await ctx.db.aiProviderConfig.findUnique({
        where: { userId: ctx.userId },
      });
      if (!config) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Please configure your AI provider in settings first.",
        });
      }

      const entry = await ctx.db.entry.findFirstOrThrow({
        where: { id: input.entryId, userId: ctx.userId },
      });

      // Step 1: Categorize
      const categorization = await categorizeEntry(config, entry);

      // Update entry with AI results
      let categoryId: string | undefined;
      if (categorization.categoryName) {
        const category = await ctx.db.category.upsert({
          where: { name: categorization.categoryName },
          update: {},
          create: {
            name: categorization.categoryName,
          },
        });
        categoryId = category.id;
      }

      await ctx.db.entry.update({
        where: { id: entry.id },
        data: {
          type: categorization.type as any,
          summary: categorization.summary,
          aiCategoryId: categoryId,
        },
      });

      // Create AI-generated tags
      if (categorization.tags?.length) {
        for (const tagName of categorization.tags) {
          const tag = await ctx.db.tag.upsert({
            where: { name_userId: { name: tagName, userId: ctx.userId } },
            update: {},
            create: { name: tagName, userId: ctx.userId },
          });
          await ctx.db.entryTag.upsert({
            where: { entryId_tagId: { entryId: entry.id, tagId: tag.id } },
            update: {},
            create: { entryId: entry.id, tagId: tag.id, isAiGenerated: true },
          });
        }
      }

      // Step 2: Generate embedding and find relationships
      try {
        await generateEmbedding(config, entry, ctx.db);
        const similar = await findSimilarEntries(ctx.db, entry.id, ctx.userId);
        if (similar.length > 0) {
          await detectRelationships(config, ctx.db, entry, similar);
        }
      } catch (e) {
        // Embedding may not be available for all providers; continue without it
        console.warn("Embedding/relationship detection skipped:", e);
      }

      return { success: true, categorization };
    }),
});
