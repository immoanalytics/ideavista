import { z } from "zod";
import { createRouter, protectedProcedure } from "../init";
import { createEntrySchema, updateEntrySchema } from "@/lib/validators";

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
      const entry = await ctx.db.entry.create({
        data: {
          title: input.title,
          content: input.content,
          type: input.type,
          userId: ctx.userId,
          metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
        },
      });
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
