import { z } from "zod";
import { createRouter, protectedProcedure } from "../init";
import { aiConfigSchema } from "@/lib/validators";
import { encrypt, decrypt } from "@/server/services/encryption";

export const settingsRouter = createRouter({
  getAiConfig: protectedProcedure.query(async ({ ctx }) => {
    try {
      const config = await ctx.db.aiProviderConfig.findUnique({
        where: { userId: ctx.userId },
      });
      if (!config) return null;
      return {
        ...config,
        apiKey: config.apiKey ? "••••••••" + decrypt(config.apiKey).slice(-4) : "",
      };
    } catch {
      return null;
    }
  }),

  updateAiConfig: protectedProcedure
    .input(aiConfigSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.isGuest) {
        throw new (await import("@trpc/server")).TRPCError({
          code: "FORBIDDEN",
          message: "AI configuration cannot be saved in guest mode. Please create an account first.",
        });
      }
      try {
        const encryptedKey = encrypt(input.apiKey);
        return await ctx.db.aiProviderConfig.upsert({
          where: { userId: ctx.userId },
          update: {
            provider: input.provider,
            apiKey: encryptedKey,
            model: input.model,
            embedModel: input.embedModel,
          },
          create: {
            userId: ctx.userId,
            provider: input.provider,
            apiKey: encryptedKey,
            model: input.model,
            embedModel: input.embedModel,
          },
        });
      } catch (error: any) {
        throw new (await import("@trpc/server")).TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database is not set up. Run: docker compose up -d && npx prisma migrate dev",
        });
      }
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        select: { id: true, name: true, email: true, image: true },
      });
    } catch {
      // Guest mode or DB not available
      if (ctx.isGuest) {
        return { id: ctx.userId, name: "Guest", email: "guest@ideavista.app", image: null };
      }
      return null;
    }
  }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(100).optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.isGuest) {
        throw new (await import("@trpc/server")).TRPCError({
          code: "FORBIDDEN",
          message: "Profile cannot be updated in guest mode. Please create an account first.",
        });
      }
      return ctx.db.user.update({
        where: { id: ctx.userId },
        data: { name: input.name },
      });
    }),
});
