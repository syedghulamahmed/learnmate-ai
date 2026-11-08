import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getOpenAIClient, openAIModel } from "@/lib/openai";
import { tutorRequestSchema } from "@/lib/schemas";
import {
  FirebaseAdminConfigurationError,
  FirebaseAdminVerificationError,
  verifyRequestUser,
} from "@/lib/firebase-admin";

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
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 16 * 1024) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }

    const uid = await verifyRequestUser(request);
    if (!uid) {
      return NextResponse.json(
        { error: "Your sign-in session could not be verified. Sign out and sign in again." },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const payload = tutorRequestSchema.parse(body);
    const openai = getOpenAIClient();
    const response = await openai.responses.create({
      model: openAIModel,
      max_output_tokens: 1200,
      instructions: tutorInstructions,
      input: [
        `Subject: ${payload.subject}`,
        `Learner level: ${payload.level}`,
        `Learning goal: ${payload.goal}`,
        `Question: ${payload.question}`,
      ].join("\n\n"),
    });

    if (!response.output_text?.trim()) {
      return NextResponse.json({ error: "The tutor returned an empty response. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ answer: response.output_text });
  } catch (error) {
    if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminVerificationError) {
      console.error("LearnMate Firebase authentication service is unavailable.");
      return NextResponse.json(
        { error: "The sign-in service is temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input. Check the question and learning settings." },
        { status: 400 },
      );
    }

    console.error("LearnMate tutor endpoint failed.");
    return NextResponse.json(
      { error: "The tutor could not respond. Please try again shortly." },
      { status: 502 },
    );
  }
}
