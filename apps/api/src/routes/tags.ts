import { FastifyInstance } from "fastify";
import { CreateTagSchema, TagResponse } from "@myday/contracts";
import { Env } from "../config.js";
import { createAuthGuard } from "../middleware/auth.js";
import { randomUUID } from "crypto";

const inMemoryTags: Map<string, TagResponse & { userId: string }> = new Map([
  [
    "t-1",
    {
      id: "t-1",
      userId: "00000000-0000-0000-0000-000000000001",
      name: "Reflection",
      normalizedName: "reflection",
      createdAt: new Date().toISOString(),
    },
  ],
  [
    "t-2",
    {
      id: "t-2",
      userId: "00000000-0000-0000-0000-000000000001",
      name: "Mindfulness",
      normalizedName: "mindfulness",
      createdAt: new Date().toISOString(),
    },
  ],
]);

export async function tagsRoutes(app: FastifyInstance, env: Env) {
  const authGuard = createAuthGuard(env);

  app.get(
    "/api/v1/tags",
    {
      preHandler: authGuard,
      schema: {
        description: "List all tags owned by the authenticated user",
        tags: ["Tags"],
      },
    },
    async (request) => {
      const userTags = Array.from(inMemoryTags.values())
        .filter((t) => t.userId === request.userId)
        .map(({ userId: _, ...tag }) => tag);
      return { data: userTags };
    }
  );

  app.post(
    "/api/v1/tags",
    {
      preHandler: authGuard,
      schema: {
        description: "Create or return an existing normalized tag",
        tags: ["Tags"],
      },
    },
    async (request, reply) => {
      const parsed = CreateTagSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid tag name",
            details: parsed.error.format(),
          },
        });
      }

      const normalized = parsed.data.name.toLowerCase().trim();
      const existing = Array.from(inMemoryTags.values()).find(
        (t) => t.userId === request.userId && t.normalizedName === normalized
      );

      if (existing) {
        const { userId: _, ...tag } = existing;
        return { data: tag };
      }

      const id = randomUUID();
      const newTag = {
        id,
        userId: request.userId,
        name: parsed.data.name.trim(),
        normalizedName: normalized,
        createdAt: new Date().toISOString(),
      };

      inMemoryTags.set(id, newTag);
      const { userId: _, ...tag } = newTag;
      return reply.status(201).send({ data: tag });
    }
  );
}
