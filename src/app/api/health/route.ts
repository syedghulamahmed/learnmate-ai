import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "learnmate-ai",
    aiProviderConfigured: Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN),
    tutorFallbackAvailable: true,
    firebaseAdminRequiredForTutor: false,
  });
}
