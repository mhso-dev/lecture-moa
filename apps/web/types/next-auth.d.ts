import type { UserRole } from "@shared";
import type { DefaultSession } from "next-auth";

/**
 * NextAuth v5 Module Augmentation
 *
 * Extends the default NextAuth types with application-specific fields:
 * - Session.user: Adds id, role, and image
 * - Session: Adds accessToken for API authorization
 * - JWT: Adds accessToken, refreshToken, role, and userId
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      image?: string | null;
    } & DefaultSession["user"];
    accessToken: string;
  }

  interface User {
    id: string;
    role: UserRole;
    accessToken: string;
    refreshToken?: string;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken?: string;
    role: UserRole;
    userId: string;
  }
}
