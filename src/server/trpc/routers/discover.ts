import { createRouter, protectedProcedure } from "../init";

export const discoverRouter = createRouter({
  feed: protectedProcedure.query(async ({ ctx }) => {
    const entries = await ctx.db.entry.findMany({
      where: { userId: ctx.userId },
      include: {
        aiCategory: true,
        tags: { include: { tag: true } },
        _count: { select: { attachments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return {
      entries: entries.map((e) => ({
        id: e.id,
        title: e.title,
        summary: e.summary,
        content: e.content.slice(0, 300),
        type: e.type,
        categoryName: e.aiCategory?.name ?? null,
        tags: e.tags.map((t) => t.tag.name),
        attachmentCount: e._count.attachments,
        createdAt: e.createdAt,
      })),
    };
  }),
});
