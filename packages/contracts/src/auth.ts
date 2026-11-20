
import { z } from "zod";

/**
 * 6. Authentication Contracts
 */
export const SignInEmailRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type SignInEmailRequest = z.infer<typeof SignInEmailRequestSchema>;

export const SignUpEmailRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});
export type SignUpEmailRequest = z.infer<typeof SignUpEmailRequestSchema>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().url().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const SessionResponseSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
