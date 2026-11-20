import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  CreateEntrySchema,
  ListEntriesQuerySchema,
  UpdateEntrySchema,
} from "@myday/contracts";
import { entryStore } from "../services/entryStore.js";
import { Env } from "../config.js";
import { createAuthGuard } from "../middleware/auth.js";

interface EntriesRoutesOptions extends FastifyPluginOptions {
  env?: Env;
  auth?: Parameters<typeof createAuthGuard>[1];
}

export async function entriesRoutes(app: FastifyInstance, opts: Env | EntriesRoutesOptions) {
  // Support both legacy (env directly) and new ({ env, auth }) shapes
  const env = "env" in opts && opts.env ? opts.env : (opts as Env);
  const auth = "auth" in opts ? opts.auth : undefined;
  const authGuard = createAuthGuard(env, auth);

  // GET /api/v1/entries - List user's entries
  app.get(
    "/api/v1/entries",
    {
      preHandler: authGuard,
      schema: {
        description: "List journal entries with filtering (date, tag, mood, text search)",
        tags: ["Journal"],
      },
    },
    async (request, reply) => {
      const parsed = ListEntriesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.format(),
          },
        });
      }

      const entries = await entryStore.list(request.userId, parsed.data);
      return { data: entries };
    }
  );

  // POST /api/v1/entries - Create a new daily entry
  app.post(
    "/api/v1/entries",
    {
      preHandler: authGuard,
      schema: {
        description: "Create a daily journal entry",
        tags: ["Journal"],
      },
    },
    async (request, reply) => {
      const parsed = CreateEntrySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid entry fields",
            details: parsed.error.format(),
          },
        });
      }

      try {
        const created = await entryStore.create(request.userId, parsed.data);
        return reply.status(201).send({ data: created });
      } catch (err: any) {
        if (err.code === "CONFLICT") {
          return reply.status(409).send({
            error: {
              code: "CONFLICT",
              message: err.message,
            },
          });
        }
        throw err;
      }
    }
  );

  // GET /api/v1/entries/:id - Get single entry
  app.get<{ Params: { id: string } }>(
    "/api/v1/entries/:id",
    {
      preHandler: authGuard,
      schema: {
        description: "Get a journal entry by ID",
        tags: ["Journal"],
      },
    },
    async (request, reply) => {
      const entry = await entryStore.getById(request.userId, request.params.id);
      if (!entry) {
        return reply.status(404).send({
          error: {
            code: "NOT_FOUND",
            message: "Entry not found",
          },
        });
      }
      return { data: entry };
    }
  );

  // PATCH /api/v1/entries/:id - Update entry (conflict-safe via baseRevision)
  app.patch<{ Params: { id: string } }>(
    "/api/v1/entries/:id",
    {
      preHandler: authGuard,
      schema: {
        description: "Update a journal entry (requires baseRevision for conflict protection)",
        tags: ["Journal"],
      },
    },
    async (request, reply) => {
      const parsed = UpdateEntrySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid update fields",
            details: parsed.error.format(),
          },
        });
      }

      try {
        const updated = await entryStore.update(
          request.userId,
          request.params.id,
          parsed.data
        );
        if (!updated) {
          return reply.status(404).send({
            error: {
              code: "NOT_FOUND",
              message: "Entry not found",
            },
          });
        }
        return { data: updated };
      } catch (err: any) {
        if (err.code === "CONFLICT") {
          return reply.status(409).send({
            error: {
              code: "CONFLICT",
              message: err.message,
            },
          });
        }
        throw err;
      }
    }
  );

  // DELETE /api/v1/entries/:id - Delete entry
  app.delete<{ Params: { id: string } }>(
    "/api/v1/entries/:id",
    {
      preHandler: authGuard,
      schema: {
        description: "Soft delete a journal entry",
        tags: ["Journal"],
      },
    },
    async (request, reply) => {
      const success = await entryStore.delete(request.userId, request.params.id);
      if (!success) {
        return reply.status(404).send({
          error: {
            code: "NOT_FOUND",
            message: "Entry not found",
          },
        });
      }
      return { success: true };
    }
  );
}
