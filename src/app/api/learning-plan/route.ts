import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { learningPlanSchema } from "@/lib/learning";

export const runtime = "nodejs";

const requestSchema = z.object({
  subject: z.string().trim().min(2).max(100),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  goal: z.string().trim().min(5).max(500),
  durationDays: z.number().int().min(3).max(30),
});

async function verifyRequestUser(request: NextRequest): Promise<string | null> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token || !apiKey) return null;
  try {
    const response = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) return null;
    const data = await response.json();
    const uid = data?.users?.[0]?.localId;
    return typeof uid === "string" && uid ? uid : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 16 * 1024) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const input = requestSchema.parse(body);
    const uid = await verifyRequestUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Your sign-in session could not be verified. Sign in again." }, { status: 401 });
    }

    const system = [
      "You are LearnMate AI, an expert instructional designer.",
      "Create a practical, progressive learning plan tailored to the learner's subject, level, goal, and duration.",
      'Return ONLY valid JSON: {"title":"string","summary":"string","lessons":[{"title":"string","objective":"string","durationMinutes":30,"explanation":"clear lesson content","practiceTask":"actionable task","quiz":[{"question":"string","options":["A","B","C","D"],"correctIndex":0,"explanation":"why the answer is correct"}]}]}.',
      "Create 3 to 7 lessons. Each lesson must contain 2 to 5 multiple-choice questions with exactly four options.",
      "Make questions test understanding, not trivia. Ensure correctIndex points to the correct option.",
      "Do not claim this plan is an official Internee.pk curriculum. Do not invent learner progress.",
    ].join(" ");

    let response: Response | null = null;
    for (const model of ["nvidia/nemotron-3.5-bolt", "poolside/laguna-xs-2.1"]) {
      try {
        response = await fetch("https://blockrun.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            temperature: 0.25,
            max_tokens: 5000,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: system + " Return only the requested JSON object. Never include hidden reasoning or markdown fences." },
              { role: "user", content: `Subject: ${input.subject}\nLevel: ${input.level}\nGoal: ${input.goal}\nDuration: ${input.durationDays} days` },
            ],
          }),
          signal: AbortSignal.timeout(28000),
        });
        if (response.ok) break;
      } catch {
        response = null;
      }
    }
    if (!response.ok) {
      return NextResponse.json({ error: "The AI service is temporarily unavailable. Please retry." }, { status: 503 });
    }
    const data = await response.json();
    const jsonText = data?.choices?.[0]?.message?.content;
    if (typeof jsonText !== "string" || !jsonText.trim()) {
      return NextResponse.json({ error: "The AI returned an empty learning plan. Please retry." }, { status: 502 });
    }

    let generated: unknown;
    try {
      generated = JSON.parse(jsonText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
    } catch {
      return NextResponse.json({ error: "The AI returned an invalid plan. Please try again." }, { status: 502 });
    }

    let plan: z.infer<typeof learningPlanSchema>;
    try {
      plan = learningPlanSchema.parse(generated);
    } catch {
      return NextResponse.json({ error: "The AI returned a plan with an invalid structure. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ plan, source: "blockrun" });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid learning-plan input. Check the subject, level, goal, and duration." }, { status: 400 });
    }
    console.error("Learning plan generation failed.");
    return NextResponse.json({ error: "Unable to generate a plan. Please try again shortly." }, { status: 502 });
  }
}
