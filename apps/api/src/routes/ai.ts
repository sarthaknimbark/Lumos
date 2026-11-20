import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AiReflectionRequestSchema } from "@myday/contracts";
import { Env } from "../config.js";
import { createAuthGuard } from "../middleware/auth.js";
import { generateReflectionPrompt } from "../services/groq.js";

interface AiRoutesOptions extends FastifyPluginOptions {
  env?: Env;
  auth?: Parameters<typeof createAuthGuard>[1];
}

export async function aiRoutes(app: FastifyInstance, opts: Env | AiRoutesOptions) {
  const env = "env" in opts && opts.env ? opts.env : (opts as Env);
  const auth = "auth" in opts ? opts.auth : undefined;
  const authGuard = createAuthGuard(env, auth);

  app.post(
    "/api/v1/ai/reflection-prompt",
    {
      preHandler: authGuard,
      schema: {
        description:
          "Generate personalized journaling reflection prompt using Groq Free API (Llama 3)",
        tags: ["AI Assistant"],
      },
    },
    async (request, reply) => {
      const parsed = AiReflectionRequestSchema.safeParse(request.body || {});
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid reflection parameters",
            details: parsed.error.format(),
          },
        });
      }

      const result = await generateReflectionPrompt(parsed.data, env.GROQ_API_KEY);
      return { data: result };
    }
  );
}
