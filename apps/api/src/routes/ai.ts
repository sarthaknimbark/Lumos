import { FastifyInstance } from "fastify";
import { AiReflectionRequestSchema } from "@myday/contracts";
import { Env } from "../config.js";
import { createAuthGuard } from "../middleware/auth.js";
import { generateReflectionPrompt } from "../services/groq.js";

export async function aiRoutes(app: FastifyInstance, env: Env) {
  const authGuard = createAuthGuard(env);

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
