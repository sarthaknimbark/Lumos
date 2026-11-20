import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  CalendarConnectInputSchema,
  CreateAttachmentInputSchema,
  DriveConnectInputSchema,
  RestoreConfirmRequestSchema,
  RestorePreviewRequestSchema,
} from "@myday/contracts";
import { Env } from "../config.js";
import { createAuthGuard } from "../middleware/auth.js";
import { calendarService } from "../services/calendarService.js";
import { driveService } from "../services/driveService.js";

interface RouteOptions extends FastifyPluginOptions {
  env: Env;
  auth: any;
}

export async function integrationsRoutes(
  app: FastifyInstance,
  options: RouteOptions
) {
  const authGuard = createAuthGuard(options.env, options.auth);

  // --------------------------------------------------------------------------
  // 1. Google Drive Integration
  // --------------------------------------------------------------------------

  // GET /api/v1/integrations/drive/status
  app.get(
    "/api/v1/integrations/drive/status",
    {
      preHandler: [authGuard],
      schema: {
        description: "Get Google Drive backup status and account connection info",
        tags: ["Integrations"],
      },
    },
    async (request) => {
      const userId = request.userId!;
      return driveService.getStatus(userId, options.env);
    }
  );

  // POST /api/v1/integrations/drive/connect
  app.post(
    "/api/v1/integrations/drive/connect",
    {
      preHandler: [authGuard],
      schema: {
        description: "Connect Google Drive with user-authorized OAuth code",
        tags: ["Integrations"],
      },
    },
    async (request, reply) => {
      const userId = request.userId!;
      const parsed = DriveConnectInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid connect payload",
            details: parsed.error.format(),
            requestId: request.id,
          },
        });
      }

      const status = await driveService.connect(userId, parsed.data, options.env);
      return status;
    }
  );

  // POST /api/v1/integrations/drive/backup
  app.post(
    "/api/v1/integrations/drive/backup",
    {
      preHandler: [authGuard],
      schema: {
        description: "Create a versioned JSON backup snapshot in app-owned Drive folder",
        tags: ["Integrations"],
      },
    },
    async (request) => {
      const userId = request.userId!;
      return driveService.createBackup(userId, options.env);
    }
  );

  // GET /api/v1/integrations/drive/backups
  app.get(
    "/api/v1/integrations/drive/backups",
    {
      preHandler: [authGuard],
      schema: {
        description: "List versioned backup snapshots created in Google Drive",
        tags: ["Integrations"],
      },
    },
    async (request) => {
      const userId = request.userId!;
      const backups = await driveService.listBackups(userId);
      return { backups };
    }
  );

  // POST /api/v1/integrations/drive/restore/preview
  app.post(
    "/api/v1/integrations/drive/restore/preview",
    {
      preHandler: [authGuard],
      schema: {
        description: "Inspect backup contents and validate checksum before restore",
        tags: ["Integrations"],
      },
    },
    async (request, reply) => {
      const userId = request.userId!;
      const parsed = RestorePreviewRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid restore preview request",
            details: parsed.error.format(),
            requestId: request.id,
          },
        });
      }

      return driveService.previewRestore(userId, parsed.data.backupId);
    }
  );

  // POST /api/v1/integrations/drive/restore/confirm
  app.post(
    "/api/v1/integrations/drive/restore/confirm",
    {
      preHandler: [authGuard],
      schema: {
        description: "Restore journal entries from backup snapshot (merge or overwrite)",
        tags: ["Integrations"],
      },
    },
    async (request, reply) => {
      const userId = request.userId!;
      const parsed = RestoreConfirmRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid restore confirm request",
            details: parsed.error.format(),
            requestId: request.id,
          },
        });
      }

      return driveService.confirmRestore(
        userId,
        parsed.data.backupId,
        parsed.data.strategy
      );
    }
  );

  // POST /api/v1/integrations/drive/disconnect
  app.post(
    "/api/v1/integrations/drive/disconnect",
    {
      preHandler: [authGuard],
      schema: {
        description: "Revoke and remove Google Drive connection tokens",
        tags: ["Integrations"],
      },
    },
    async (request) => {
      const userId = request.userId!;
      await driveService.disconnect(userId, options.env);
      return { success: true, message: "Google Drive disconnected" };
    }
  );

  // --------------------------------------------------------------------------
  // 2. Google Calendar Read-Only Integration (Phase 8)
  // --------------------------------------------------------------------------

  // GET /api/v1/integrations/calendar/status
  app.get(
    "/api/v1/integrations/calendar/status",
    {
      preHandler: [authGuard],
      schema: {
        description: "Get Google Calendar connection status",
        tags: ["Integrations"],
      },
    },
    async (request) => {
      const userId = request.userId!;
      return calendarService.getStatus(userId, options.env);
    }
  );

  // POST /api/v1/integrations/calendar/connect
  app.post(
    "/api/v1/integrations/calendar/connect",
    {
      preHandler: [authGuard],
      schema: {
        description: "Connect Google Calendar with user-authorized read-only OAuth code",
        tags: ["Integrations"],
      },
    },
    async (request, reply) => {
      const userId = request.userId!;
      const parsed = CalendarConnectInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid calendar connect payload",
            details: parsed.error.format(),
            requestId: request.id,
          },
        });
      }

      return calendarService.connect(userId, parsed.data, options.env);
    }
  );

  // GET /api/v1/integrations/calendar/events?date=YYYY-MM-DD
  app.get<{ Querystring: { date?: string } }>(
    "/api/v1/integrations/calendar/events",
    {
      preHandler: [authGuard],
      schema: {
        description: "Get read-only calendar events for diary date context",
        tags: ["Integrations"],
      },
    },
    async (request, reply) => {
      const userId = request.userId!;
      const date = request.query.date || new Date().toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Query parameter 'date' must be in YYYY-MM-DD format",
            requestId: request.id,
          },
        });
      }

      return calendarService.getEventsForDate(userId, date, options.env);
    }
  );

  // POST /api/v1/integrations/calendar/disconnect
  app.post(
    "/api/v1/integrations/calendar/disconnect",
    {
      preHandler: [authGuard],
      schema: {
        description: "Disconnect Google Calendar and clear tokens",
        tags: ["Integrations"],
      },
    },
    async (request) => {
      const userId = request.userId!;
      await calendarService.disconnect(userId, options.env);
      return { success: true, message: "Google Calendar disconnected" };
    }
  );

  // --------------------------------------------------------------------------
  // 2. Entry Attachments
  // --------------------------------------------------------------------------

  // GET /api/v1/entries/:id/attachments
  app.get<{ Params: { id: string } }>(
    "/api/v1/entries/:id/attachments",
    {
      preHandler: [authGuard],
      schema: {
        description: "List attachments for a journal entry",
        tags: ["Attachments"],
      },
    },
    async (request) => {
      const userId = request.userId!;
      return driveService.getAttachments(userId, request.params.id);
    }
  );

  // POST /api/v1/entries/:id/attachments
  app.post<{ Params: { id: string } }>(
    "/api/v1/entries/:id/attachments",
    {
      preHandler: [authGuard],
      schema: {
        description: "Link a Google Drive file attachment to an entry",
        tags: ["Attachments"],
      },
    },
    async (request, reply) => {
      const userId = request.userId!;
      const parsed = CreateAttachmentInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid attachment metadata",
            details: parsed.error.format(),
            requestId: request.id,
          },
        });
      }

      const created = await driveService.addAttachment(
        userId,
        request.params.id,
        parsed.data
      );
      return reply.status(201).send(created);
    }
  );

  // DELETE /api/v1/attachments/:id
  app.delete<{ Params: { id: string } }>(
    "/api/v1/attachments/:id",
    {
      preHandler: [authGuard],
      schema: {
        description: "Delete an attachment reference",
        tags: ["Attachments"],
      },
    },
    async (request) => {
      const userId = request.userId!;
      await driveService.deleteAttachment(userId, request.params.id);
      return { success: true, message: "Attachment deleted" };
    }
  );
}
