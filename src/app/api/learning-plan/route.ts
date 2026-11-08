import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getOpenAIClient, openAIModel } from "@/lib/openai";
import { learningPlanSchema } from "@/lib/learning";
import {
  FirebaseAdminConfigurationError,
  FirebaseAdminVerificationError,
  verifyRequestUser,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";

const requestSchema = z.object({
  subject: z.string().trim().min(2).max(100),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  goal: z.string().trim().min(5).max(500),
  durationDays: z.number().int().min(3).max(30),
});

export async function POST(request: NextRequest) {
  try {
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 16 * 1024) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }

    const uid = await verifyRequestUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Sign in to generate a learning plan." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const input = requestSchema.parse(body);
    const openai = getOpenAIClient(request.headers.get("x-vercel-oidc-token") || undefined);
    const response = await openai.responses.create({
      model: openAIModel,
      max_output_tokens: 5000,
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

    const jsonText = response.output_text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    let generated: unknown;
    try {
      generated = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ error: "The AI returned an invalid plan. Please try again." }, { status: 502 });
    }

    let plan: z.infer<typeof learningPlanSchema>;
    try {
      plan = learningPlanSchema.parse(generated);
    } catch {
      return NextResponse.json({ error: "The AI returned a plan with an invalid structure. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ plan });
  } catch (error) {
    if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminVerificationError) {
      console.error("LearnMate Firebase authentication service is unavailable.");
      return NextResponse.json({ error: "The sign-in service is temporarily unavailable. Please try again later." }, { status: 503 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid learning-plan input. Check the subject, level, goal, and duration." }, { status: 400 });
    }
    console.error("Learning plan generation failed.");
    return NextResponse.json({ error: "Unable to generate a plan. Please try again shortly." }, { status: 502 });
  }
}
