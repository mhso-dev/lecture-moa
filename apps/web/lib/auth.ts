import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

/**
 * NextAuth v5 Configuration
 *
 * This is a placeholder configuration file.
 * Full authentication implementation will be added in FE-002.
 *
 * TODO (FE-002):
 * - Configure authentication providers (credentials, OAuth)
 * - Set up database adapter for user persistence
 * - Configure session strategy (JWT or database)
 * - Add custom pages (login, error)
 * - Configure callbacks (jwt, session, signIn)
 * - Add role-based access control
 */

export const authConfig: NextAuthConfig = {
  providers: [
    // TODO: Add authentication providers
    // Example:
    // Credentials({
    //   name: "credentials",
    //   credentials: {
    //     email: { label: "Email", type: "email" },
    //     password: { label: "Password", type: "password" },
    //   },
    //   async authorize(credentials) {
    //     // Validate credentials and return user
    //     return null;
    //   },
    // }),
  ],
  callbacks: {
    // TODO: Configure callbacks
    // async jwt({ token, user }) {
    //   if (user) {
    //     token.role = user.role;
    //   }
    //   return token;
    // },
    // async session({ session, token }) {
    //   if (session.user) {
    //     session.user.role = token.role;
    //   }
    //   return session;
    // },
  },
  pages: {
    // TODO: Configure custom pages
    signIn: "/login",
    // signOut: "/auth/signout",
    // error: "/auth/error",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
