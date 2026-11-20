/**
 * authGuard — Fastify preHandler that extracts and verifies the caller's
 * identity using Better Auth (when available), then sets request.userId.
 *
 * Priority:
 *   1. Better Auth session (cookie on web, Bearer token on native)
 *   2. Dev-only test-user bypass (NODE_ENV !== 'production' only)
 *   3. Reject with 401
 *
 * NEVER trusts a client-supplied userId in the request body or query.
 *
 * The `auth` parameter is optional for backward compatibility — when not
 * provided, only the dev bypass and legacy bearer placeholder are checked.
 * In Phase 5, all routes will receive the auth instance.
 */

import { FastifyReply, FastifyRequest } from "fastify";
import type { Env } from "../config.js";

// Forward-declare the auth type without a hard import to keep this file
// compatible even before Better Auth is fully wired into every route.
type AuthLike = {
  api: {
    getSession: (opts: { headers: unknown }) => Promise<{
      user?: { id: string; email: string } | null;
    } | null>;
  };
};

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

export function createAuthGuard(env: Env, auth?: AuthLike) {
  return async function authGuard(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    // ── 1. Try Better Auth session verification ───────────────────────────
    if (auth) {
      try {
        const session = await auth.api.getSession({
          headers: request.headers as unknown as Headers,
        });

        if (session?.user?.id) {
          request.userId = session.user.id;
          return;
        }
      } catch (err) {
        // Better Auth throws when no session present — this is expected
        request.log.debug({ err }, "[authGuard] No Better Auth session found");
      }
    } else {
      // Legacy path: check raw Bearer token header
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        if (token && token.length > 10) {
          // Placeholder — real session verification done by Better Auth in auth routes
          request.userId = env.TEST_USER_ID;
          return;
        }
      }
    }

    // ── 2. Dev-only test user bypass ──────────────────────────────────────
    if (env.ENABLE_TEST_USER_BYPASS && env.NODE_ENV !== "production") {
      const testUserHeader = request.headers["x-test-user-id"];
      if (typeof testUserHeader === "string" && testUserHeader.trim()) {
        request.userId = testUserHeader.trim();
        request.log.warn(
          { userId: request.userId },
          "[authGuard] DEV bypass via x-test-user-id header"
        );
        return;
      }
      // Fallback to default dev test user
      request.userId = env.TEST_USER_ID;
      request.log.warn(
        { userId: request.userId },
        "[authGuard] DEV bypass via default TEST_USER_ID"
      );
      return;
    }

    // ── 3. Reject — not authenticated ────────────────────────────────────
    return reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        requestId: request.id,
      },
    });
  };
}
