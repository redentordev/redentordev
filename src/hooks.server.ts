import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { getDb } from "$lib/server/db";
import { getAuth } from "$lib/server/auth";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  // Skip during build time
  if (building) {
    return resolve(event);
  }

  // Initialize database and auth with platform bindings
  const db = getDb(event.platform!.env.DB);

  // Use the actual request origin as BASE_URL - this ensures it matches for auth routes
  const baseURL = new URL(event.request.url).origin;

  const auth = getAuth(db, {
    BASE_URL: baseURL,
    TELEGRAM_WEBHOOK_URL: event.platform!.env.TELEGRAM_WEBHOOK_URL,
    TELEGRAM_API_KEY: event.platform!.env.TELEGRAM_API_KEY,
    ALLOWED_EMAIL: event.platform!.env.ALLOWED_EMAIL,
  });

  // Debug: Log request details
  console.log(`[HOOK] ${event.request.method} ${event.url.pathname}`);
  console.log(`[HOOK] BASE_URL: ${baseURL}`);
  console.log(`[HOOK] Auth baseURL: ${auth.options.baseURL}`);

  // Handle Better Auth routes - this intercepts /api/auth/* routes
  // For non-auth routes, it calls resolve internally
  return svelteKitHandler({
    event,
    resolve: async (event) => {
      // Fetch current session from Better Auth for non-auth routes
      const session = await auth.api.getSession({
        headers: event.request.headers,
      });

      // Make session and user available on server
      if (session) {
        event.locals.session = session.session;
        event.locals.user = session.user;
      }

      return resolve(event);
    },
    auth,
    building,
  });
};
