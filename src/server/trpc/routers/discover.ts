import { Prisma } from "@prisma/client";
import { createRouter, protectedProcedure } from "../init";

export const discoverRouter = createRouter({
  feed: protectedProcedure.query(async ({ ctx }) => {
    // Categories with top entries
    const categories = await ctx.db.category.findMany({
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

    // Uncategorized recent entries
    const uncategorized = await ctx.db.entry.findMany({
      where: { userId: ctx.userId, aiCategoryId: null },
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Top tags
    const topTags = await ctx.db.tag.findMany({
      where: { userId: ctx.userId },
      include: {
        _count: { select: { entries: true } },
      },
      orderBy: { entries: { _count: "desc" } },
      take: 10,
    });

    // Entries with URL metadata (rich media)
    const allEntries = await ctx.db.entry.findMany({
      where: {
        userId: ctx.userId,
        metadata: { not: Prisma.JsonNull },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const richEntries = allEntries.filter((e: any) => {
      const meta = e.metadata as any;
      return meta?.urls?.length > 0;
    });

    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: c.icon,
        entryCount: c._count.entries,
        entries: c.entries.map((e) => ({
          id: e.id,
          title: e.title,
          summary: e.summary,
          type: e.type,
          metadata: e.metadata,
          tags: e.tags.map((t) => t.tag.name),
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
      topTags: topTags.map((t) => ({
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
    };
  }),
});
