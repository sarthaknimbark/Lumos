import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().optional(),
  API_BASE_URL: z.string().default("http://localhost:4000"),
  APP_WEB_URL: z.string().default("http://localhost:8081"),
  GROQ_API_KEY: z.string().optional(),
  ENABLE_TEST_USER_BYPASS: z.coerce
    .boolean()
    .default(process.env.NODE_ENV !== "production"),
  TEST_USER_ID: z
    .string()
    .uuid()
    .default("00000000-0000-0000-0000-000000000001"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment configuration");
  }
  return result.data;
}
