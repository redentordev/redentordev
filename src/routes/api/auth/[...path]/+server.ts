import type { RequestHandler } from "./$types";
import { building } from "$app/environment";
import { getDb } from "$lib/server/db";
import { getAuth } from "$lib/server/auth";

// Catch-all route for Better Auth API endpoints
// This is a fallback in case svelteKitHandler in hooks.server.ts doesn't catch the route
// Better Auth handles the actual request processing
export const GET: RequestHandler = async ({ request, platform, params }) => {
  const path = params.path || "";
  console.log(`[ROUTE] GET /api/auth/${path}`);
  console.log(`[ROUTE] Full URL: ${request.url}`);

  if (building || !platform?.env) {
    return new Response("Not available", { status: 503 });
  }

  const db = getDb(platform.env.DB);
  const baseURL = new URL(request.url).origin;

  const auth = getAuth(db, {
    BASE_URL: baseURL,
    TELEGRAM_WEBHOOK_URL: platform.env.TELEGRAM_WEBHOOK_URL,
    TELEGRAM_API_KEY: platform.env.TELEGRAM_API_KEY,
    ALLOWED_EMAIL: platform.env.ALLOWED_EMAIL,
  });

  console.log(`[ROUTE] Calling auth.handler for ${request.url}`);

  // Forward the request to Better Auth's handler
  // This handles all /api/auth/* routes including magic-link verification
  try {
    const response = await auth.handler(request);
    console.log(`[ROUTE] Auth handler returned status: ${response.status}`);
    console.log(
      `[ROUTE] Response headers:`,
      Object.fromEntries(response.headers.entries())
    );
    return response;
  } catch (error) {
    console.error(`[ROUTE] Auth handler error:`, error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export const POST: RequestHandler = GET;
export const PUT: RequestHandler = GET;
export const DELETE: RequestHandler = GET;
export const PATCH: RequestHandler = GET;
