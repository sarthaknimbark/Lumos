import { FastifyInstance } from "fastify";
import { checkDbConnection } from "@myday/db";
import { Env } from "../config.js";

export async function healthRoutes(app: FastifyInstance, env: Env) {
  const getDbStatus = async (): Promise<"connected" | "disconnected" | "unconfigured"> => {
    if (!env.DATABASE_URL) return "unconfigured";
    const ok = await checkDbConnection(env.DATABASE_URL);
    return ok ? "connected" : "disconnected";
  };

  app.get(
    "/health",
    {
      schema: {
        description: "Process health and uptime check",
        tags: ["System"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              version: { type: "string" },
              timestamp: { type: "string" },
              uptime: { type: "number" },
              database: { type: "string" },
            },
          },
        },
      },
    },
    async () => {
      const dbStatus = await getDbStatus();
      return {
        status: dbStatus === "disconnected" ? "degraded" : "ok",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
      };
    }
  );

  app.get(
    "/ready",
    {
      schema: {
        description: "Readiness probe verifying database connectivity",
        tags: ["System"],
        response: {
          200: {
            type: "object",
            properties: {
              ready: { type: "boolean" },
              database: { type: "string" },
              timestamp: { type: "string" },
            },
          },
          503: {
            type: "object",
            properties: {
              ready: { type: "boolean" },
              database: { type: "string" },
              timestamp: { type: "string" },
            },
          },
        },
      },
    },
    async (_req, reply) => {
      const dbStatus = await getDbStatus();
      const isReady = dbStatus === "connected" || dbStatus === "unconfigured";
      return reply.status(isReady ? 200 : 503).send({
        ready: isReady,
        database: dbStatus,
        timestamp: new Date().toISOString(),
      });
    }
  );

  app.get(
    "/api/v1/health",
    {
      schema: {
        description: "Versioned API v1 health endpoint",
        tags: ["System"],
      },
    },
    async () => {
      const dbStatus = await getDbStatus();
      return {
        status: dbStatus === "disconnected" ? "degraded" : "ok",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
      };
    }
  );
}
