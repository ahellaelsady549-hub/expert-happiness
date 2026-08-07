import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const askQuestion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ question: z.string().min(3).max(1000) }).parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("خدمة الذكاء الاصطناعي غير مهيأة.");
    const { askIslamicAi } = await import("./ai.server");
    return { answer: await askIslamicAi(data.question, apiKey) };
  });
