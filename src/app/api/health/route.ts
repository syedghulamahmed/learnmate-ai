import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return NextResponse.json({
    status: "ok",
    service: "learnmate-ai",
    aiProviderConfigured: Boolean(process.env.AI_GATEWAY_API_KEY || request.headers.get("x-vercel-oidc-token")),
    tutorFallbackAvailable: true,
    firebaseAdminRequiredForTutor: false,
  });
}
