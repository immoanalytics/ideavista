import { z } from "zod";
import { createRouter, protectedProcedure } from "../init";
import { aiConfigSchema } from "@/lib/validators";
import { encrypt, decrypt } from "@/server/services/encryption";

export const settingsRouter = createRouter({
  getAiConfig: protectedProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.aiProviderConfig.findUnique({
      where: { userId: ctx.userId },
    });
    if (!config) return null;
    return {
      ...config,
      apiKey: config.apiKey ? "••••••••" + decrypt(config.apiKey).slice(-4) : "",
    };
  }),

  updateAiConfig: protectedProcedure
    .input(aiConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const encryptedKey = encrypt(input.apiKey);
      return ctx.db.aiProviderConfig.upsert({
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
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, name: true, email: true, image: true },
    });
  }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(100).optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.userId },
        data: { name: input.name },
      });
    }),
});
