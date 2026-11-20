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
  q: z.string().optional(),
  tag: z.string().optional(),
  mood: z.coerce.number().min(1).max(5).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});
export type ListEntriesQuery = z.infer<typeof ListEntriesQuerySchema>;

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
