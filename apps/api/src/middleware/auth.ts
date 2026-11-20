import { FastifyReply, FastifyRequest } from "fastify";
import { Env } from "../config.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

export function createAuthGuard(env: Env) {
  return async function authGuard(request: FastifyRequest, reply: FastifyReply) {
    // 1. Check for standard Bearer token or session (will be expanded in Phase 4)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      if (token && token.length > 10) {
        // Placeholder for verified session token
        request.userId = env.TEST_USER_ID;
        return;
      }
    }

    // 2. Local-only development test user guard
    if (env.ENABLE_TEST_USER_BYPASS && env.NODE_ENV !== "production") {
      const testUserHeader = request.headers["x-test-user-id"];
      if (typeof testUserHeader === "string" && testUserHeader.trim()) {
        request.userId = testUserHeader.trim();
        return;
      }
      // Default to dev test user
      request.userId = env.TEST_USER_ID;
      return;
    }

    // 3. Reject unauthenticated requests in production
    return reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required to access this resource",
      },
    });
  };
}
