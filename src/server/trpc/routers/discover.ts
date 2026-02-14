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
        take: 30,
      });

      return {
        categories: categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          icon: c.icon,
          entryCount: c._count.entries,
        })),
        entries: entries.map((e) => {
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
          };
        }),
      };
    }),
});
