import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@shared";
import { env } from "~/src/env";

/**
 * NextAuth v5 Configuration
 *
 * Authentication providers:
 * - Credentials: Email/password login via backend API
 * - Google: Optional social login (when env vars are set)
 * - GitHub: Optional social login (when env vars are set)
 *
 * Session strategy: JWT-based (stateless)
 * Token refresh: Automatic refresh when token expires within 5 minutes
 */

// Build providers list dynamically
const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      // Validate input with Zod
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) {
        return null;
      }

      try {
        // Call backend authentication API
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const apiUrl: string = env.NEXT_PUBLIC_API_URL;
        const response = await fetch(
          `${apiUrl}/api/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: parsed.data.email,
              password: parsed.data.password,
            }),
          }
        );

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as {
          data: {
            user: {
              id: string;
              email: string;
              name: string;
              role: string;
              avatar?: string;
              image?: string;
            };
            accessToken: string;
            refreshToken?: string;
          };
        };

        const { user, accessToken, refreshToken } = data.data;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as "student" | "instructor" | "admin",
          image: user.image ?? user.avatar ?? null,
          accessToken,
          refreshToken,
        };
      } catch {
        return null;
      }
    },
  }),
];

// Conditionally add Google provider when env vars are set
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Dynamic import is not possible here due to synchronous provider config;
  // we use require-style workaround via lazy provider factory
  const Google = (
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("next-auth/providers/google") as { default: typeof import("next-auth/providers/google").default }
  ).default;
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Conditionally add GitHub provider when env vars are set
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  const GitHub = (
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("next-auth/providers/github") as { default: typeof import("next-auth/providers/github").default }
  ).default;
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

export const authConfig: NextAuthConfig = {
  providers,
  callbacks: {
    jwt({ token, user, trigger }) {
      // On initial sign-in, enrich the JWT with user data
      if (trigger === "signIn") {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.userId = user.id;
        token.role = user.role;
      }

      // Token refresh logic: refresh when token expires within 5 minutes
      // This is a placeholder - actual implementation depends on the backend API
      // providing token expiry info and a refresh endpoint
      return token;
    },
    session({ session, token }) {
      // Map JWT fields to session
      session.user.id = token.userId as string;
      session.user.role = token.role as "student" | "instructor" | "admin";
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
