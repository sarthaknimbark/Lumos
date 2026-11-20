import { z } from "zod";

export * from "./auth.js";

/**
 * 1. System & Health
 */
export const HealthResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "error"]),
  version: z.string(),
  timestamp: z.string(),
  uptime: z.number(),
  database: z.enum(["connected", "disconnected", "unconfigured"]).optional(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ReadyResponseSchema = z.object({
  ready: z.boolean(),
  database: z.enum(["connected", "disconnected", "unconfigured"]),
  timestamp: z.string(),
});
export type ReadyResponse = z.infer<typeof ReadyResponseSchema>;

/**
 * 2. Standard API Error Response (matching docs/API_CONTRACT.md)
 */
export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
  }),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

/**
 * 3. Journal Entry Models & DTOs
 */
export const SectionTypeSchema = z.enum([
  "highlights",
  "gratitude",
  "learned",
  "tomorrow",
  "freeform",
]);
export type SectionType = z.infer<typeof SectionTypeSchema>;

export const EntrySectionInputSchema = z.object({
  sectionType: SectionTypeSchema,
  content: z.string(),
  sortOrder: z.number().int().optional().default(0),
});
export type EntrySectionInput = z.infer<typeof EntrySectionInputSchema>;

export const EntrySectionOutputSchema = EntrySectionInputSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type EntrySectionOutput = z.infer<typeof EntrySectionOutputSchema>;

export const CreateEntrySchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  title: z.string().max(255).optional().nullable(),
  body: z.string().min(1, "Journal body is required"),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  energy: z.number().int().min(1).max(5).optional().nullable(),
  status: z.enum(["draft", "published"]).default("draft"),
  isFavorite: z.boolean().default(false),
  sections: z.array(EntrySectionInputSchema).optional().default([]),
  tags: z.array(z.string().min(1).max(50)).optional().default([]),
});
export type CreateEntryInput = z.infer<typeof CreateEntrySchema>;

export const UpdateEntrySchema = z.object({
  baseRevision: z.number().int().min(1, "baseRevision is required for conflict detection"),
  title: z.string().max(255).optional().nullable(),
  body: z.string().min(1).optional(),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  energy: z.number().int().min(1).max(5).optional().nullable(),
  status: z.enum(["draft", "published"]).optional(),
  isFavorite: z.boolean().optional(),
  sections: z.array(EntrySectionInputSchema).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
});
export type UpdateEntryInput = z.infer<typeof UpdateEntrySchema>;

export const JournalEntryResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  entryDate: z.string(),
  title: z.string().nullable().optional(),
  body: z.string(),
  mood: z.number().nullable().optional(),
  energy: z.number().nullable().optional(),
  status: z.string(),
  isFavorite: z.boolean(),
  revision: z.number(),
  sections: z.array(EntrySectionOutputSchema),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type JournalEntryResponse = z.infer<typeof JournalEntryResponseSchema>;

export const ListEntriesQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  q: z.string().optional(),
  tag: z.string().optional(),
  mood: z.coerce.number().min(1).max(5).optional(),
  energy: z.coerce.number().min(1).max(5).optional(),
  isFavorite: z.coerce.boolean().optional(),
  cursor: z.string().optional(),
  offset: z.coerce.number().min(0).optional().default(0),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});
export type ListEntriesQuery = z.input<typeof ListEntriesQuerySchema>;

/**
 * 4. Tags DTOs
 */
export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
});
export type CreateTagInput = z.infer<typeof CreateTagSchema>;

export const TagResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  normalizedName: z.string(),
  createdAt: z.string(),
});
export type TagResponse = z.infer<typeof TagResponseSchema>;

/**
 * 5. Groq Free AI Reflection Assistant DTOs
 */
export const AiReflectionRequestSchema = z.object({
  promptType: z.enum(["reflection", "gratitude", "tomorrow", "summary"]).default("reflection"),
  mood: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  entryContext: z.string().max(2000).optional(),
});
export type AiReflectionRequest = z.infer<typeof AiReflectionRequestSchema>;

export const AiReflectionResponseSchema = z.object({
  prompt: z.string(),
  model: z.string(),
  source: z.enum(["groq", "fallback"]),
  suggestedSections: z.array(z.string()).optional(),
});
export type AiReflectionResponse = z.infer<typeof AiReflectionResponseSchema>;

/**
 * 6. Offline Sync Models & DTOs
 */
export const SyncActionSchema = z.enum(["create", "update", "delete"]);
export type SyncAction = z.infer<typeof SyncActionSchema>;

export const SyncStatusSchema = z.enum(["pending", "syncing", "synced", "failed", "conflict"]);
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

export const QueuedOperationSchema = z.object({
  id: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  action: SyncActionSchema,
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entryId: z.string().optional(),
  baseRevision: z.number().int().optional(),
  payload: z.unknown(),
  status: SyncStatusSchema,
  attempts: z.number().int().default(0),
  lastError: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type QueuedOperation = z.infer<typeof QueuedOperationSchema>;

export const ConflictResolutionSchema = z.object({
  strategy: z.enum(["keep_server", "keep_local", "keep_both"]),
  entryId: z.string(),
  serverRevision: z.number().int(),
  localPayload: z.unknown().optional(),
});
export type ConflictResolution = z.infer<typeof ConflictResolutionSchema>;

/**
 * 7. Google Drive Integration & Attachments DTOs (Phase 7)
 */
export const DriveStatusResponseSchema = z.object({
  connected: z.boolean(),
  providerAccountId: z.string().nullable().optional(),
  scopes: z.array(z.string()).optional(),
  lastBackupAt: z.string().nullable().optional(),
  backupCount: z.number().int().default(0),
  appFolderName: z.string().default("MyDay Backups"),
});
export type DriveStatusResponse = z.infer<typeof DriveStatusResponseSchema>;

export const DriveConnectInputSchema = z.object({
  authCode: z.string().min(1, "Authorization code is required"),
  redirectUri: z.string().url().optional(),
});
export type DriveConnectInput = z.infer<typeof DriveConnectInputSchema>;

export const DriveBackupItemSchema = z.object({
  id: z.string(),
  filename: z.string(),
  sizeBytes: z.number().int(),
  entryCount: z.number().int(),
  checksum: z.string(),
  createdAt: z.string(),
  version: z.string().default("1.0.0"),
});
export type DriveBackupItem = z.infer<typeof DriveBackupItemSchema>;

export const DriveBackupListResponseSchema = z.object({
  backups: z.array(DriveBackupItemSchema),
});
export type DriveBackupListResponse = z.infer<typeof DriveBackupListResponseSchema>;

export const RestorePreviewRequestSchema = z.object({
  backupId: z.string().min(1, "Backup ID is required"),
});
export type RestorePreviewRequest = z.infer<typeof RestorePreviewRequestSchema>;

export const RestorePreviewResponseSchema = z.object({
  backupId: z.string(),
  filename: z.string(),
  version: z.string(),
  createdAt: z.string(),
  entryCount: z.number().int(),
  previewDates: z.array(z.string()),
});
export type RestorePreviewResponse = z.infer<typeof RestorePreviewResponseSchema>;

export const RestoreConfirmRequestSchema = z.object({
  backupId: z.string().min(1, "Backup ID is required"),
  strategy: z.enum(["merge", "overwrite"]).default("merge"),
});
export type RestoreConfirmRequest = z.infer<typeof RestoreConfirmRequestSchema>;

export const RestoreConfirmResponseSchema = z.object({
  success: z.boolean(),
  restoredCount: z.number().int(),
  message: z.string(),
});
export type RestoreConfirmResponse = z.infer<typeof RestoreConfirmResponseSchema>;

export const CreateAttachmentInputSchema = z.object({
  providerFileId: z.string().min(1),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024, "File size must not exceed 25MB"),
});
export type CreateAttachmentInput = z.infer<typeof CreateAttachmentInputSchema>;

export const AttachmentResponseSchema = z.object({
  id: z.string().uuid(),
  entryId: z.string().uuid(),
  provider: z.string(),
  providerFileId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  createdAt: z.string(),
});
export type AttachmentResponse = z.infer<typeof AttachmentResponseSchema>;

