import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { getDb } from "$lib/server/db";
import { getAuth } from "$lib/server/auth";

export const GET: RequestHandler = async ({ platform, request }) => {
  const db = getDb(platform!.env.DB);
  const auth = getAuth(db);

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
