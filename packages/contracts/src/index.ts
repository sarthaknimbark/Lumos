import { z } from "zod";

/**
 * Health check response schema
 */
export const HealthResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "error"]),
  version: z.string(),
  timestamp: z.string(),
  uptime: z.number(),
  database: z.enum(["connected", "disconnected", "unconfigured"]).optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

/**
 * Standard API error response schema
 */
export const ApiErrorResponseSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
  requestId: z.string().optional(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

/**
 * Standard pagination query schema
 */
export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
