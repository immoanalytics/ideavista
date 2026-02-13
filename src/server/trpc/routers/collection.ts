import { z } from "zod";
import { createRouter, protectedProcedure } from "../init";
import { createCollectionSchema, updateCollectionSchema } from "@/lib/validators";

export const collectionRouter = createRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.collection.findMany({
        where: { userId: ctx.userId },
        include: { _count: { select: { entries: true, shares: true } } },
        orderBy: { updatedAt: "desc" },
      });
    } catch {
      return [];
    }
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const collection = await ctx.db.collection.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.userId },
            { shares: { some: { sharedWithId: ctx.userId } } },
          ],
        },
        include: {
          entries: {
            include: { entry: { include: { aiCategory: true, tags: { include: { tag: true } } } } },
            orderBy: { addedAt: "desc" },
          },
          shares: { include: { sharedWith: { select: { id: true, name: true, email: true, image: true } } } },
        },
      });
      if (!collection) throw new Error("Collection not found");
      return collection;
    }),

  create: protectedProcedure
    .input(createCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.collection.create({
        data: { ...input, userId: ctx.userId },
      });
    }),

  update: protectedProcedure
    .input(updateCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.collection.update({
        where: { id, userId: ctx.userId },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.collection.delete({
        where: { id: input.id, userId: ctx.userId },
      });
      return { success: true };
    }),

  addEntry: protectedProcedure
    .input(z.object({ collectionId: z.string().cuid(), entryId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.collection.findFirstOrThrow({
        where: { id: input.collectionId, userId: ctx.userId },
      });
      return ctx.db.collectionEntry.create({
        data: { collectionId: input.collectionId, entryId: input.entryId },
      });
    }),

  removeEntry: protectedProcedure
    .input(z.object({ collectionId: z.string().cuid(), entryId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.collectionEntry.delete({
        where: {
          collectionId_entryId: {
            collectionId: input.collectionId,
            entryId: input.entryId,
          },
        },
      });
      return { success: true };
    }),
});
