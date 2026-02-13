import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/entries") ||
        nextUrl.pathname.startsWith("/collections") ||
        nextUrl.pathname.startsWith("/visualize") ||
        nextUrl.pathname.startsWith("/shared") ||
        nextUrl.pathname.startsWith("/settings");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // redirect to login
      }
      if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
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
