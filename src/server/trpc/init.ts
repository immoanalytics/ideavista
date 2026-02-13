import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { cookies } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export const GUEST_USER_ID = "guest-demo-user";

export const createTRPCContext = async () => {
  const session = await auth();
  const cookieStore = await cookies();
  const isGuest = cookieStore.get("guest_mode")?.value === "true";
  return { db, session, isGuest };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const userId = ctx.session?.user?.id;
  const isGuest = ctx.isGuest;

  if (!userId && !isGuest) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: userId ?? GUEST_USER_ID,
      isGuest: !!isGuest,
    },
  });
});
