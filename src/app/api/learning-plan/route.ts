import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getOpenAIClient, openAIModel } from "@/lib/openai";
import { learningPlanSchema } from "@/lib/learning";
import { verifyRequestUser } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const requestSchema = z.object({
  subject: z.string().trim().min(2).max(100),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  goal: z.string().trim().min(5).max(500),
  durationDays: z.number().int().min(3).max(30),
});

export async function POST(request: NextRequest) {
  try {
    const uid = await verifyRequestUser(request);
    if (!uid) return NextResponse.json({ error: "Sign in to generate a learning plan." }, { status: 401 });
    const input = requestSchema.parse(await request.json());
    const openai = getOpenAIClient();
    const response = await openai.responses.create({
      model: openAIModel,
      instructions: [
        "You are LearnMate AI, an expert instructional designer.",
        "Create a practical, progressive learning plan tailored to the learner's subject, level, goal, and available duration.",
        'Return ONLY valid JSON matching this shape: {"title":"string","summary":"string","lessons":[{"title":"string","objective":"string","durationMinutes":30,"explanation":"clear lesson content","practiceTask":"actionable task","quiz":[{"question":"string","options":["A","B","C","D"],"correctIndex":0,"explanation":"why the answer is correct"}]}]}',
        "Create 3 to 7 lessons. Each lesson must contain 2 to 5 multiple-choice questions with exactly four options.",
        "Make questions test understanding, not trivia. Ensure correctIndex points to the correct option.",
        "Do not claim this plan is an official Internee.pk curriculum. Do not invent learner progress.",
      ].join(" "),
      input: `Subject: ${input.subject}\nLevel: ${input.level}\nGoal: ${input.goal}\nDuration: ${input.durationDays} days`,
    });
    const plan = learningPlanSchema.parse(JSON.parse(response.output_text));
    return NextResponse.json({ plan });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "The request or generated plan was invalid. Please try again." }, { status: 400 });
    }
    console.error("Learning plan generation failed:", error);
    return NextResponse.json({ error: "Unable to generate a plan. Check the server configuration and try again." }, { status: 500 });
  }
}
