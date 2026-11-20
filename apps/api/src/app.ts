import Fastify, { FastifyError, FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { Env } from "./config.js";
import { createAuth } from "./auth.js";
import { aiRoutes } from "./routes/ai.js";
import { authRoutes } from "./routes/auth.js";
import { entriesRoutes } from "./routes/entries.js";
import { healthRoutes } from "./routes/health.js";
import { integrationsRoutes } from "./routes/integrations.js";
import { tagsRoutes } from "./routes/tags.js";

export async function buildApp(env: Env): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== "test" ? { level: "info" } : false,
    genReqId: () => {
      // Custom or crypto random request ID
      return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    },
  });

  // 0. Create Better Auth instance (shared across the app)
  const auth = createAuth(env);

  // 1. Core plugins
  await app.register(sensible);
  await app.register(cookie, {
    // Cookie secret for signing (uses AUTH_SECRET)
    secret: env.AUTH_SECRET,
    parseOptions: {},
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowedOrigins = [
        env.APP_WEB_URL,
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
      ];
      if (allowedOrigins.includes(origin) || env.NODE_ENV === "development") {
        return cb(null, true);
      }
      cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  });

  // 2. OpenAPI & Swagger UI
  await app.register(swagger, {
    openapi: {
      info: {
        title: "MyDay Platform API",
        description:
          "Independent, private diary and memory platform API. Features REST v1 endpoints, Groq free AI assistance, and offline sync contracts.",
        version: "0.1.0",
      },
      servers: [
        {
          url: env.API_BASE_URL,
          description: "Current API Server",
        },
      ],
      tags: [
        { name: "System", description: "Health and readiness checks" },
        { name: "Auth", description: "Authentication — email/password and Google OAuth" },
        { name: "Journal", description: "Daily diary entries and reflections" },
        { name: "Tags", description: "Normalized tag organization" },
        { name: "AI Assistant", description: "Groq Free API reflection assistance" },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });

  // Expose raw OpenAPI JSON spec
  app.get("/api/v1/openapi.json", async () => {
    return app.swagger();
  });

  // 3. Centralized 404 and Error Handler (matching docs/API_CONTRACT.md)
  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: `Route ${request.method}:${request.url} not found`,
        requestId: request.id,
      },
    });
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode || 500;
    const errorCode =
      error.code ||
      (statusCode === 404
        ? "NOT_FOUND"
        : statusCode === 400
        ? "VALIDATION_ERROR"
        : statusCode === 409
        ? "CONFLICT"
        : statusCode === 401
        ? "UNAUTHORIZED"
        : "INTERNAL_SERVER_ERROR");

    return reply.status(statusCode).send({
      error: {
        code: errorCode,
        message:
          statusCode === 500
            ? "An unexpected error occurred. Please try again later."
            : error.message,
        details: (error as any).details || undefined,
        requestId: request.id,
      },
    });
  });

  // 4. Register Route Modules
  await app.register(healthRoutes, env);
  await app.register(authRoutes, { env, auth });
  await app.register(entriesRoutes, { env, auth });
  await app.register(tagsRoutes, { env, auth });
  await app.register(aiRoutes, { env, auth });
  await app.register(integrationsRoutes, { env, auth });

  return app;
}
