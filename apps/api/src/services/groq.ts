import { Groq } from "groq-sdk";
import { AiReflectionRequest, AiReflectionResponse } from "@myday/contracts";

const FALLBACK_PROMPTS: Record<string, string[]> = {
  reflection: [
    "What was the single most meaningful moment of today, and what made it stand out?",
    "Where did you feel most in flow or at peace today?",
    "If you could relive one hour from today, which would it be and why?",
  ],
  gratitude: [
    "What small, often-overlooked comfort helped you get through today?",
    "Who is someone whose presence or words brought ease to your day?",
    "Name three ordinary things in your environment right now that you appreciate.",
  ],
  tomorrow: [
    "What is the single most important task that would make tomorrow feel successful?",
    "What mindset or energy do you want to bring into tomorrow morning?",
    "Is there anything from today that you need to let go of before tomorrow begins?",
  ],
  summary: [
    "Reflect on the recurring patterns in your thoughts today and where your attention naturally flowed.",
  ],
};

export async function generateReflectionPrompt(
  req: AiReflectionRequest,
  apiKey?: string
): Promise<AiReflectionResponse> {
  const promptType = req.promptType || "reflection";

  // 1. If no API key is provided, use calm curated offline fallbacks
  if (!apiKey || apiKey.trim() === "") {
    const list = FALLBACK_PROMPTS[promptType] || FALLBACK_PROMPTS.reflection!;
    const randomIndex = Math.floor(Math.random() * list.length);
    return {
      prompt: list[randomIndex]!,
      model: "offline-curated",
      source: "fallback",
      suggestedSections: ["highlights", "gratitude", "learned"],
    };
  }

  // 2. Call Groq free API with Llama 3
  try {
    const groq = new Groq({ apiKey });

    const systemPrompt = `You are a calm, minimalist reflection companion for a private personal journal called MyDay.
Your goal is to suggest a single, thought-provoking, grounding journaling prompt.
Keep it concise (1 to 2 sentences max). Do not use cheesy clichés or overwhelming questions.
Focus on mindfulness, genuine growth, and emotional clarity.`;

    const userMessage = `Generate a ${promptType} prompt.
Mood level (1-5): ${req.mood || "not specified"}.
Tags: ${req.tags?.join(", ") || "none"}.
Context: ${req.entryContext || "A quiet evening reflection"}.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Empty response from Groq");
    }

    return {
      prompt: content,
      model: "llama-3.1-8b-instant",
      source: "groq",
      suggestedSections: ["highlights", "gratitude", "tomorrow"],
    };
  } catch (err: any) {
    console.warn("Groq API call failed, falling back to local prompts:", err.message);
    const list = FALLBACK_PROMPTS[promptType] || FALLBACK_PROMPTS.reflection!;
    return {
      prompt: list[0]!,
      model: "offline-fallback",
      source: "fallback",
    };
  }
}
