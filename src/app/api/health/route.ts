import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "learnmate-ai",
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    firebaseAdminConfigured: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY),
  });
}
