import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { NextRequest } from "next/server";

export class FirebaseAdminConfigurationError extends Error {
  constructor() {
    super("Firebase Admin credentials are missing or invalid.");
    this.name = "FirebaseAdminConfigurationError";
  }
}

function getAdminAuth() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!projectId || !clientEmail || !privateKey) {
    throw new FirebaseAdminConfigurationError();
  }

  try {
    const app = getApps()[0] || initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    return getAuth(app);
  } catch {
    throw new FirebaseAdminConfigurationError();
  }
}

export async function verifyRequestUser(request: NextRequest): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  if (!token) return null;

  const auth = getAdminAuth();
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    console.error(
      "LearnMate Firebase ID-token verification failed:",
      error instanceof Error ? error.message : "Unknown verification error",
    );
    return null;
  }
}
