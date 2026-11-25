/**
 * Verify a Firebase Authentication ID token through the project's Identity Toolkit
 * account lookup endpoint. The Firebase web API key is public configuration; the
 * bearer token is the credential and is never logged or returned.
 */
export async function verifyFirebaseRequestUser(request: Request): Promise<string | null> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\\s+(.+)$/i)?.[1]?.trim();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!token || token.length > 8192 || !apiKey) return null;

  try {
    const response = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) return null;

    const data = await response.json() as { users?: Array<{ localId?: unknown }> };
    const uid = data.users?.[0]?.localId;
    return typeof uid === "string" && uid ? uid : null;
  } catch {
    return null;
  }
}
