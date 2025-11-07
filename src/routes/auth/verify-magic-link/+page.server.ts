import { redirect, type RequestEvent, isRedirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db";
import { getAuth } from "$lib/server/auth";

export const load = async ({ url, platform, request }: RequestEvent) => {
  console.log("[VERIFY] Magic link verification started");
  console.log("[VERIFY] URL:", url.toString());

  if (!platform?.env) {
    console.error("[VERIFY] Platform env not available");
    throw redirect(302, "/todos?error=SERVER_ERROR");
  }

  const token = url.searchParams.get("token");
  const callbackURL = url.searchParams.get("callbackURL") || "/todos";

  console.log("[VERIFY] Token:", token);
  console.log("[VERIFY] Callback URL:", callbackURL);

  if (!token) {
    console.error("[VERIFY] No token provided");
    throw redirect(302, `${callbackURL}?error=MISSING_TOKEN`);
  }

  try {
    const db = getDb(platform.env.DB);
    const baseURL = url.origin;

    const auth = getAuth(db, {
      BASE_URL: baseURL,
      TELEGRAM_WEBHOOK_URL: platform.env.TELEGRAM_WEBHOOK_URL,
      TELEGRAM_API_KEY: platform.env.TELEGRAM_API_KEY,
      ALLOWED_EMAIL: platform.env.ALLOWED_EMAIL,
    });

    console.log("[VERIFY] Calling auth.api.magicLinkVerify");

    // Verify the magic link token using Better Auth's server API
    // According to docs: https://www.better-auth.com/docs/plugins/magic-link
    const result = await auth.api.magicLinkVerify({
      query: {
        token,
      },
      headers: request.headers,
    });

    console.log("[VERIFY] Verification result:", result);

    // If verification is successful, Better Auth returns the session data
    // The session cookies are automatically set by Better Auth
    console.log(
      "[VERIFY] Verification successful, redirecting to:",
      callbackURL
    );
    throw redirect(302, callbackURL);
  } catch (error) {
    // If it's a redirect, re-throw it (SvelteKit redirects are special errors)
    if (isRedirect(error)) {
      throw error;
    }

    // Log the actual error for debugging
    console.error(
      "[VERIFY] Unexpected error:",
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error) {
      console.error("[VERIFY] Error stack:", error.stack);
    }
    throw redirect(302, `${callbackURL}?error=VERIFICATION_ERROR`);
  }
};
