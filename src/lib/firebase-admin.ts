import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { NextRequest } from "next/server";

export class FirebaseAdminConfigurationError extends Error {
  constructor() {
    super("Firebase Admin credentials are missing or invalid.");
    this.name = "FirebaseAdminConfigurationError";
  }
}

export class FirebaseAdminVerificationError extends Error {
  constructor() {
    super("Firebase Admin token verification is temporarily unavailable.");
    this.name = "FirebaseAdminVerificationError";
  }
}

function getAdminAuth() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  const missing: string[] = [];
  if (!projectId) missing.push("FIREBASE_ADMIN_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
  if (!privateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
  if (missing.length) {
    console.error("LearnMate Firebase Admin configuration is missing:", missing.join(", "));
    throw new FirebaseAdminConfigurationError();
  }
  if (!privateKey || !privateKey.includes("-----BEGIN PRIVATE KEY-----") || !privateKey.includes("-----END PRIVATE KEY-----")) {
    console.error("LearnMate Firebase Admin private key is not in service-account PEM format.");
    throw new FirebaseAdminConfigurationError();
  }

  try {
    const app = getApps()[0] || initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    return getAuth(app);
  } catch (error) {
    console.error(
      "LearnMate Firebase Admin initialization failed:",
      error instanceof Error ? error.name : "unknown error",
    );
    throw new FirebaseAdminConfigurationError();
  }
}

const INVALID_TOKEN_CODES = new Set([
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/user-disabled",
  "auth/user-not-found",
]);

export async function verifyRequestUser(request: NextRequest): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token || token.length > 8192) return null;

  const auth = getAdminAuth();
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

    if (INVALID_TOKEN_CODES.has(code)) return null;

    console.error("LearnMate Firebase token verification is temporarily unavailable:", code || "unknown error");
    throw new FirebaseAdminVerificationError();
  }
}


export function isFirebaseAdminReady(): boolean {
  try {
    getAdminAuth();
    return true;
  } catch {
    return false;
  }
}
