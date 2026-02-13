import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { nextUrl } = request;
      const isGuest = request.cookies.get("guest_mode")?.value === "true";
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/entries") ||
        nextUrl.pathname.startsWith("/collections") ||
        nextUrl.pathname.startsWith("/visualize") ||
        nextUrl.pathname.startsWith("/shared") ||
        nextUrl.pathname.startsWith("/settings");
      if (isOnDashboard) {
        if (isLoggedIn || isGuest) return true;
        return false; // redirect to login
      }
      if ((isLoggedIn || isGuest) && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // added in auth.ts
};
