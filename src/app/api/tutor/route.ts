import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getOpenAIClient, openAIModel } from "@/lib/openai";
import { tutorRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const tutorInstructions = [
  "You are LearnMate AI, a patient, precise personal tutor for university students and interns.",
  "Adapt explanations to the learner's stated subject, level, and goal.",
  "Structure useful answers with: a direct explanation, a simple example, key points, and one short practice question.",
  "Do not claim to know a learner's private progress unless it is explicitly provided.",
  "Do not fabricate sources, facts, or capabilities. State uncertainty when appropriate.",
  "Encourage understanding; do not simply produce work for dishonest submission.",
].join(" ");

export async function POST(request: NextRequest) {
  try {
    const payload = tutorRequestSchema.parse(await request.json());
    const openai = getOpenAIClient();

    const response = await openai.responses.create({
      model: openAIModel,
      instructions: tutorInstructions,
      input: [
        `Subject: ${payload.subject}`,
        `Learner level: ${payload.level}`,
        `Learning goal: ${payload.goal}`,
        `Question: ${payload.question}`,
      ].join("\n\n"),
    });

    return NextResponse.json({ answer: response.output_text });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input. Check the question and learning settings." }, { status: 400 });
    }

    console.error("LearnMate tutor endpoint failed:", error);
    return NextResponse.json(
      { error: "The tutor could not respond. Check the server configuration and try again." },
      { status: 500 },
    );
  }
}
