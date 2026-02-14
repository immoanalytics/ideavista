import { z } from "zod";
import { createRouter, protectedProcedure } from "../init";

export const discoverRouter = createRouter({
  feed: protectedProcedure
    .input(
      z
        .object({
          categoryId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const categoryFilter = input?.categoryId;

      // Categories for the chip bar
      let categories: any[] = [];
      try {
        categories = await ctx.db.category.findMany({
          where: { entries: { some: { userId: ctx.userId } } },
          include: {
            _count: { select: { entries: true } },
          },
          orderBy: { entries: { _count: "desc" } },
        });
      } catch (e) {
        console.warn("Failed to load categories:", e);
      }

      // Total entry count for the "All" chip
      const totalCount = await ctx.db.entry.count({
        where: { userId: ctx.userId },
      });

      // Entries — filtered by category if selected
      const entries = await ctx.db.entry.findMany({
        where: {
          userId: ctx.userId,
          ...(categoryFilter ? { aiCategoryId: categoryFilter } : {}),
        },
        include: {
          aiCategory: true,
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // When viewing "All" (no category filter), deduplicate by category:
      // Show only the best entry per category (most tags), with a count of
      // how many more entries exist in that category.
      let feedEntries = entries;
      const moreInCategoryMap = new Map<string, number>();

      if (!categoryFilter) {
        const grouped = new Map<string, typeof entries>();
        const uncategorized: typeof entries = [];

        for (const e of entries) {
          const catId = e.aiCategoryId;
          if (!catId) {
            uncategorized.push(e);
            continue;
          }
          if (!grouped.has(catId)) grouped.set(catId, []);
          grouped.get(catId)!.push(e);
        }

        // Pick the best entry per category (most tags = most enriched)
        const deduped: typeof entries = [];
        for (const [, group] of grouped) {
          const sorted = [...group].sort(
            (a, b) => b.tags.length - a.tags.length
          );
          deduped.push(sorted[0]);
          if (group.length > 1) {
            moreInCategoryMap.set(sorted[0].id, group.length - 1);
          }
        }

        // Sort deduped by createdAt desc, then append uncategorized
        deduped.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        feedEntries = [...deduped, ...uncategorized];
      }

      return {
        totalCount,
        categories: categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          icon: c.icon,
          entryCount: c._count.entries,
        })),
        entries: feedEntries.map((e) => {
          const meta = e.metadata as any;
          const ogImage = meta?.urls?.[0]?.image ?? null;
          const ogSiteName = meta?.urls?.[0]?.siteName ?? null;

          const imageKeyword = meta?.imageKeyword ?? null;

          return {
            id: e.id,
            title: e.title,
            summary: e.summary,
            content: e.content.slice(0, 300),
            type: e.type,
            categoryName: e.aiCategory?.name ?? null,
            categoryColor: e.aiCategory?.color ?? null,
            tags: e.tags.map((t) => t.tag.name),
            image: ogImage,
            imageKeyword,
            siteName: ogSiteName,
            createdAt: e.createdAt,
            moreInCategory: moreInCategoryMap.get(e.id) ?? 0,
          };
        }),
      };
    }),
});
