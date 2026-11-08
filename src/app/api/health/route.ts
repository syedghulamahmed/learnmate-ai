import { NextResponse } from "next/server";
import { isFirebaseAdminReady } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET() {
  const firebaseAdminReady = isFirebaseAdminReady();
  return NextResponse.json({
    status: "ok",
    service: "learnmate-ai",
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    firebaseAdminConfigured: firebaseAdminReady,
  });
}
