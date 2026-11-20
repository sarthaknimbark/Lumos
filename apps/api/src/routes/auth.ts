/**
 * Auth routes — mounts Better Auth handler at /api/auth/*
 *
 * Better Auth handles its own sub-routes internally:
 *   POST /api/auth/sign-in/email
 *   POST /api/auth/sign-up/email
 *   POST /api/auth/sign-out
 *   GET  /api/auth/session
 *   GET  /api/auth/callback/google
 *   ...etc
 *
 * We pass all /api/auth/* requests directly to the Better Auth handler.
 */

import { FastifyInstance, FastifyPluginOptions } from "fastify";
import type { AuthInstance } from "../auth.js";
import type { Env } from "../config.js";

interface AuthRoutesOptions extends FastifyPluginOptions {
  env: Env;
  auth: AuthInstance;
}

export async function authRoutes(
  app: FastifyInstance,
  opts: AuthRoutesOptions
) {
  const { auth } = opts;

  /**
   * Wildcard handler: all requests to /api/auth/* are delegated to Better Auth.
   * Better Auth handles CORS, session cookies, OAuth redirects internally.
   */
  app.all("/api/auth/*", async (request, reply) => {
    // Convert Fastify request to a web-standard Request object
    const url = `${request.protocol}://${request.hostname}${request.url}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else if (value !== undefined) {
        headers.set(key, String(value));
      }
    }

    const webRequest = new Request(url, {
      method: request.method,
      headers,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? JSON.stringify(request.body)
          : undefined,
    });

    try {
      const response = await auth.handler(webRequest);

      // Pipe response headers
      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });

      reply.status(response.status);

      const body = await response.text();
      return reply.send(body);
    } catch (err) {
      request.log.error({ err }, "[authRoutes] Better Auth handler error");
      return reply.status(500).send({
        error: {
          code: "AUTH_ERROR",
          message: "Authentication service error",
          requestId: request.id,
        },
      });
    }
  });

  /**
   * GET /api/v1/auth/session — convenience endpoint to check current session.
   * Returns 200 with session data or 401.
   */
  app.get(
    "/api/v1/auth/session",
    {
      schema: {
        tags: ["Auth"],
        summary: "Get current session",
        description:
          "Returns the current user session. Send the session cookie (web) or Bearer token (native) in the Authorization header.",
        response: {
          200: {
            type: "object",
            properties: {
              userId: { type: "string" },
              email: { type: "string" },
              name: { type: "string" },
              image: { type: "string", nullable: true },
              createdAt: { type: "string" },
            },
          },
          401: {
            type: "object",
            properties: {
              error: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const headers = new Headers();
        for (const [key, value] of Object.entries(request.headers)) {
          if (Array.isArray(value)) {
            for (const v of value) headers.append(key, v);
          } else if (value !== undefined) {
            headers.set(key, String(value));
          }
        }
        const session = await auth.api.getSession({
          headers,
        });

        if (!session?.user) {
          return reply.status(401).send({
            error: {
              code: "UNAUTHORIZED",
              message: "No active session",
              requestId: request.id,
            },
          });
        }

        return {
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image ?? null,
          createdAt: session.user.createdAt,
        };
      } catch {
        return reply.status(401).send({
          error: {
            code: "UNAUTHORIZED",
            message: "No active session",
            requestId: request.id,
          },
        });
      }
    }
  );
}
