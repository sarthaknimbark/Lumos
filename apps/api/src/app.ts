import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { HealthResponse } from "@myday/contracts";
import { checkDbConnection } from "@myday/db";
import { Env } from "./config.js";

export async function buildApp(env: Env): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== "test" ? { level: "info" } : false,
  });

  await app.register(sensible);
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
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

  const getHealthData = async (): Promise<HealthResponse> => {
    let dbStatus: "connected" | "disconnected" | "unconfigured" = "unconfigured";
    if (env.DATABASE_URL) {
      const isConnected = await checkDbConnection(env.DATABASE_URL);
      dbStatus = isConnected ? "connected" : "disconnected";
    }

    return {
      status: dbStatus === "disconnected" ? "degraded" : "ok",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    };
  };

  // Root health endpoint
  app.get("/health", async () => {
    return getHealthData();
  });

  // Versioned API health endpoint
  app.get("/api/v1/health", async () => {
    return getHealthData();
  });

  return app;
}
