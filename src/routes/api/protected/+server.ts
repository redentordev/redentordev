import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { getDb } from "$lib/server/db";
import { getAuth } from "$lib/server/auth";

export const GET: RequestHandler = async ({ platform, request }) => {
  const db = getDb(platform!.env.DB);

  // Ensure BASE_URL is set - use request URL as fallback
  const baseURL =
    platform!.env.BASE_URL ||
    new URL(request.url).origin ||
    "http://localhost:5173";

  const auth = getAuth(db, {
    BASE_URL: baseURL,
    TELEGRAM_WEBHOOK_URL: platform!.env.TELEGRAM_WEBHOOK_URL,
    TELEGRAM_API_KEY: platform!.env.TELEGRAM_API_KEY,
    ALLOWED_EMAIL: platform!.env.ALLOWED_EMAIL,
  });

  // Check authentication
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // User is authenticated, return protected data
  return json({
    message: "This is protected data",
    user: session.user,
  });
};
