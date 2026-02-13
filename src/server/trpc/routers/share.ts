import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, protectedProcedure } from "../init";
import { shareCollectionSchema } from "@/lib/validators";

export const shareRouter = createRouter({
  create: protectedProcedure
    .input(shareCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      await ctx.db.collection.findFirstOrThrow({
        where: { id: input.collectionId, userId: ctx.userId },
      });

      // Find target user
      const targetUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User with that email not found",
        });
      }
      if (targetUser.id === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot share with yourself",
        });
      }

      return ctx.db.share.upsert({
        where: {
          collectionId_sharedWithId: {
            collectionId: input.collectionId,
            sharedWithId: targetUser.id,
          },
        },
        update: { permission: input.permission },
        create: {
          collectionId: input.collectionId,
          ownerId: ctx.userId,
          sharedWithId: targetUser.id,
          permission: input.permission,
        },
      });
    }),

  revoke: protectedProcedure
    .input(z.object({ shareId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const share = await ctx.db.share.findFirstOrThrow({
        where: { id: input.shareId, ownerId: ctx.userId },
      });
      await ctx.db.share.delete({ where: { id: share.id } });
      return { success: true };
    }),

  listSharedWithMe: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.share.findMany({
        where: { sharedWithId: ctx.userId },
        include: {
          collection: {
            include: { _count: { select: { entries: true } } },
          },
          owner: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      return [];
    }
  }),
});
