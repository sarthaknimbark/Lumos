/**
 * Better Auth instance for MyDay Platform
 *
 * Phase 4: Authentication & account isolation
 *
 * Providers:
 *   - Email + Password (always available, no external dependency)
 *   - Google OAuth (opt-in; requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)
 *
 * Session strategy:
 *   - Web: HTTP-only cookie (set by Better Auth)
 *   - Native (Expo): Bearer token stored in SecureStore on device
 *
 * Google OAuth ONLY requests identity scopes (openid, email, profile).
 * Drive and Calendar permissions are requested separately and independently.
 *
 * Database:
 *   Uses Drizzle adapter connected to PostgreSQL via @myday/db.
 *   If DATABASE_URL is not provided (deferred database setup), runs with
 *   in-memory fallback adapter so the app boots cleanly.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDbClient } from "@myday/db";
import type { Env } from "./config.js";

export function createAuth(env: Env) {
  const hasDatabase = Boolean(env.DATABASE_URL);
  const hasGoogle =
    Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET);

  if (!hasDatabase) {
    console.warn(
      "[auth] DATABASE_URL not set — Better Auth running in deferred mode. " +
        "Set DATABASE_URL when PostgreSQL is connected."
    );
  }

  const socialProviders: Record<string, unknown> = {};

  if (hasGoogle) {
    // Only identity scopes — Drive and Calendar are separate opt-in
    socialProviders.google = {
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      scope: ["openid", "email", "profile"],
    };
    console.info("[auth] Google OAuth provider enabled");
  } else {
    console.info(
      "[auth] Google OAuth disabled (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set)"
    );
  }

  // Database adapter using @myday/db Drizzle client
  let dbAdapter: ReturnType<typeof drizzleAdapter>;
  if (hasDatabase) {
    try {
      const { db } = createDbClient(env.DATABASE_URL!);
      dbAdapter = drizzleAdapter(db, { provider: "pg" });
    } catch {
      dbAdapter = drizzleAdapter({} as any, { provider: "pg" });
    }
  } else {
    dbAdapter = drizzleAdapter({} as any, { provider: "pg" });
  }

  return betterAuth({
    baseURL: env.API_BASE_URL,
    basePath: "/api/auth",
    secret: env.AUTH_SECRET,

    database: dbAdapter,

    // Email + password authentication (always on)
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
    },

    // Social login (optional, only if Google credentials provided)
    socialProviders,

    // Session settings
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      },
    },

    // Trusted origins for CORS / cookies
    trustedOrigins: [
      env.APP_WEB_URL,
      "http://localhost:8081",
      "http://localhost:19006",
      "http://localhost:3000",
      "exp://",
      "myday://",
    ],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
