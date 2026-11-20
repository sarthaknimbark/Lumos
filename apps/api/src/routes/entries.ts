import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  CreateEntrySchema,
  ListEntriesQuerySchema,
  UpdateEntrySchema,
} from "@myday/contracts";
import { entryService } from "../services/entryService.js";
import { Env } from "../config.js";
import { createAuthGuard } from "../middleware/auth.js";

interface EntriesRoutesOptions extends FastifyPluginOptions {
  env?: Env;
  auth?: Parameters<typeof createAuthGuard>[1];
}

export async function entriesRoutes(
  app: FastifyInstance,
  opts: Env | EntriesRoutesOptions
) {
  const env = "env" in opts && opts.env ? opts.env : (opts as Env);
  const auth = "auth" in opts ? opts.auth : undefined;
  const authGuard = createAuthGuard(env, auth);

  // 1. GET /api/v1/entries - List user's entries with search, filters & pagination
  app.get(
    "/api/v1/entries",
    {
      preHandler: authGuard,
      schema: {
        description:
          "List journal entries with filtering (date, tag, mood, energy, isFavorite, text search) and offset pagination",
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

      const { data, total } = await entryService.list(
        request.userId,
        parsed.data
      );
      return {
        data,
        pagination: {
          total,
          offset: parsed.data.offset || 0,
          limit: parsed.data.limit || 20,
        },
      };
    }
  );

  // 2. GET /api/v1/entries/by-date/:date - Date navigation helper
  app.get<{ Params: { date: string } }>(
    "/api/v1/entries/by-date/:date",
    {
      preHandler: authGuard,
      schema: {
        description: "Get entry by local diary date (YYYY-MM-DD)",
        tags: ["Journal"],
      },
    },
    async (request, reply) => {
      const { date } = request.params;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Date must be in YYYY-MM-DD format",
          },
        });
      }

      const entry = await entryService.getByDate(request.userId, date);
      if (!entry) {
        return reply.status(404).send({
          error: {
            code: "NOT_FOUND",
            message: `No journal entry found for date ${date}`,
          },
        });
      }
      return { data: entry };
    }
  );

  // 3. POST /api/v1/entries - Create a daily entry
  app.post(
    "/api/v1/entries",
    {
      preHandler: authGuard,
      schema: {
        description:
          "Create a daily journal entry (enforces one main entry per local date)",
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
        const created = await entryService.create(request.userId, parsed.data);
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

  // 4. GET /api/v1/entries/:id - Get single entry
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
      const entry = await entryService.getById(request.userId, request.params.id);
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

  // 5. PATCH /api/v1/entries/:id - Update entry (conflict-safe via baseRevision)
  app.patch<{ Params: { id: string } }>(
    "/api/v1/entries/:id",
    {
      preHandler: authGuard,
      schema: {
        description:
          "Update a journal entry (requires baseRevision for optimistic conflict protection)",
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
        const updated = await entryService.update(
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
        if (err.code === "NOT_FOUND") {
          return reply.status(404).send({
            error: {
              code: "NOT_FOUND",
              message: err.message,
            },
          });
        }
        throw err;
      }
    }
  );

  // 6. DELETE /api/v1/entries/:id - Soft-delete entry
  app.delete<{ Params: { id: string } }>(
    "/api/v1/entries/:id",
    {
      preHandler: authGuard,
      schema: {
        description: "Delete a journal entry",
        tags: ["Journal"],
      },
    },
    async (request, reply) => {
      const success = await entryService.delete(request.userId, request.params.id);
      if (!success) {
        return reply.status(404).send({
          error: {
            code: "NOT_FOUND",
            message: "Entry not found",
          },
        });
      }
      return reply.status(204).send();
    }
  );
}
