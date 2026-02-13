import { z } from "zod";
import { createRouter, protectedProcedure } from "../init";

export const tagRouter = createRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.tag.findMany({
        where: { userId: ctx.userId },
        include: { _count: { select: { entries: true } } },
        orderBy: { name: "asc" },
      });
    } catch {
      return [];
    }
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tag.create({
        data: { name: input.name, userId: ctx.userId },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.tag.delete({
        where: { id: input.id, userId: ctx.userId },
      });
      return { success: true };
    }),
});
