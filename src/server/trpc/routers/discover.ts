import { Prisma } from "@prisma/client";
import { createRouter, protectedProcedure } from "../init";

export const discoverRouter = createRouter({
  feed: protectedProcedure.query(async ({ ctx }) => {
    // Categories with top entries
    let categories: any[] = [];
    try {
      categories = await ctx.db.category.findMany({
        where: { entries: { some: { userId: ctx.userId } } },
        include: {
          entries: {
            where: { userId: ctx.userId },
            include: { tags: { include: { tag: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          _count: { select: { entries: true } },
        },
        orderBy: { entries: { _count: "desc" } },
      });
    } catch (e) {
      console.warn("Failed to load categories:", e);
    }

    // All recent entries (always shown)
    const recentEntries = await ctx.db.entry.findMany({
      where: { userId: ctx.userId },
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Uncategorized entries
    const uncategorized = recentEntries.filter((e) => !e.aiCategoryId);

    // Top tags
    let topTags: any[] = [];
    try {
      topTags = await ctx.db.tag.findMany({
        where: { userId: ctx.userId },
        include: {
          _count: { select: { entries: true } },
        },
        orderBy: { entries: { _count: "desc" } },
        take: 10,
      });
    } catch (e) {
      console.warn("Failed to load tags:", e);
    }

    // Entries with URL metadata (rich media)
    let richEntries: any[] = [];
    try {
      const allEntries = await ctx.db.entry.findMany({
        where: {
          userId: ctx.userId,
          metadata: { not: Prisma.JsonNull },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      richEntries = allEntries.filter((e: any) => {
        const meta = e.metadata as any;
        return meta?.urls?.length > 0;
      });
    } catch (e) {
      console.warn("Failed to load rich entries:", e);
    }

    return {
      categories: categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: c.icon,
        entryCount: c._count.entries,
        entries: c.entries.map((e: any) => ({
          id: e.id,
          title: e.title,
          summary: e.summary,
          type: e.type,
          metadata: e.metadata,
          tags: e.tags.map((t: any) => t.tag.name),
          createdAt: e.createdAt,
        })),
      })),
      uncategorized: uncategorized.map((e) => ({
        id: e.id,
        title: e.title,
        content: e.content.slice(0, 200),
        type: e.type,
        tags: e.tags.map((t) => t.tag.name),
        createdAt: e.createdAt,
      })),
      topTags: topTags.map((t: any) => ({
        id: t.id,
        name: t.name,
        entryCount: t._count.entries,
      })),
      richEntries: richEntries.slice(0, 20).map((e: any) => ({
        id: e.id,
        title: e.title,
        summary: e.summary,
        type: e.type,
        metadata: e.metadata,
        createdAt: e.createdAt,
      })),
      recentEntries: recentEntries.map((e) => ({
        id: e.id,
        title: e.title,
        content: e.content.slice(0, 200),
        summary: e.summary,
        type: e.type,
        tags: e.tags.map((t) => t.tag.name),
        createdAt: e.createdAt,
      })),
    };
  }),
});
