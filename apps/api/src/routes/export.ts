/**
 * Export & Import Routes — Phase 9
 *
 * Provides:
 *   - GET /api/v1/export?format=json|markdown
 *   - POST /api/v1/import/preview
 *   - POST /api/v1/import/confirm
 *   - DELETE /api/v1/account/data
 */

import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  AccountDataDeletionResponseSchema,
  ExportQuerySchema,
  ImportConfirmInputSchema,
  ImportConfirmResponseSchema,
  ImportPreviewInputSchema,
  ImportPreviewResponseSchema,
  JournalExportPayloadSchema,
} from "@myday/contracts";
import { Env } from "../config.js";
import { createAuthGuard } from "../middleware/auth.js";
import { exportService } from "../services/exportService.js";

interface RouteOptions extends FastifyPluginOptions {
  env: Env;
  auth: any;
}

export async function exportRoutes(
  app: FastifyInstance,
  options: RouteOptions
) {
  const { env, auth } = options;
  const guard = createAuthGuard(env, auth);

  // --------------------------------------------------------------------------
  // 1. Export Data (JSON or Markdown)
  // --------------------------------------------------------------------------
  app.get("/api/v1/export", {
    preHandler: [guard],
    schema: {
      tags: ["Export / Import"],
      summary: "Export personal diary data in JSON or Markdown format",
      querystring: {
        type: "object",
        properties: {
          format: { type: "string", enum: ["json", "markdown"], default: "json" },
        },
      },
    },
    handler: async (request, reply) => {
      const user = (request as any).user;
      const queryParsed = ExportQuerySchema.safeParse(request.query);
      const format = queryParsed.success ? queryParsed.data.format : "json";

      if (format === "markdown") {
        const markdown = await exportService.exportMarkdown(user.id);
        const filename = `myday-export-${new Date().toISOString().slice(0, 10)}.md`;

        reply.header("Content-Type", "text/markdown; charset=utf-8");
        reply.header(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        return reply.send(markdown);
      }

      // Default JSON format
      const jsonPayload = await exportService.exportJson(user.id);
      const filename = `myday-export-${new Date().toISOString().slice(0, 10)}.json`;

      reply.header("Content-Type", "application/json; charset=utf-8");
      reply.header(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      return reply.send(jsonPayload);
    },
  });

  // --------------------------------------------------------------------------
  // 2. Import Preview (validates file structure and detects date conflicts)
  // --------------------------------------------------------------------------
  app.post("/api/v1/import/preview", {
    preHandler: [guard],
    schema: {
      tags: ["Export / Import"],
      summary: "Validate import file and preview potential date conflicts",
      body: {
        type: "object",
        required: ["data"],
        properties: {
          data: { type: "object" },
        },
      },
    },
    handler: async (request, reply) => {
      const user = (request as any).user;
      const bodyParsed = ImportPreviewInputSchema.safeParse(request.body);

      if (!bodyParsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid import preview request",
            details: bodyParsed.error.format(),
            requestId: request.id,
          },
        });
      }

      const preview = await exportService.previewImport(
        user.id,
        bodyParsed.data.data
      );
      return reply.send(preview);
    },
  });

  // --------------------------------------------------------------------------
  // 3. Import Confirm (Merge or Overwrite)
  // --------------------------------------------------------------------------
  app.post("/api/v1/import/confirm", {
    preHandler: [guard],
    schema: {
      tags: ["Export / Import"],
      summary: "Apply imported entries with chosen strategy (merge or overwrite)",
      body: {
        type: "object",
        required: ["data"],
        properties: {
          strategy: { type: "string", enum: ["merge", "overwrite"], default: "merge" },
          data: { type: "object" },
        },
      },
    },
    handler: async (request, reply) => {
      const user = (request as any).user;
      const bodyParsed = ImportConfirmInputSchema.safeParse(request.body);

      if (!bodyParsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid import confirm payload",
            details: bodyParsed.error.format(),
            requestId: request.id,
          },
        });
      }

      const result = await exportService.confirmImport(
        user.id,
        bodyParsed.data
      );
      return reply.send(result);
    },
  });

  // --------------------------------------------------------------------------
  // 4. Delete Account Data Workflow
  // --------------------------------------------------------------------------
  app.delete("/api/v1/account/data", {
    preHandler: [guard],
    schema: {
      tags: ["Export / Import"],
      summary: "Irreversibly delete all diary entries, attachments, and tokens for the authenticated user",
    },
    handler: async (request, reply) => {
      const user = (request as any).user;
      const result = await exportService.deleteAccountData(user.id);
      return reply.send(result);
    },
  });
}
