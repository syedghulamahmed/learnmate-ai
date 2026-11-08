import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "learnmate-ai",
    aiProviderConfigured: Boolean(process.env.OPENAI_API_KEY),
    tutorFallbackAvailable: true,
    firebaseAdminRequiredForTutor: false,
  });
}
