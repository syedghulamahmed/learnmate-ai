import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "learnmate-ai",
    aiProviderConfigured: true,
    aiProvider: "blockrun",
    tutorFallbackAvailable: true,
    firebaseAdminRequiredForTutor: false,
  });
}
