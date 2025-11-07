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

  // Use svelteKitHandler according to Better Auth docs
  // It will handle auth routes and call resolve for non-auth routes
  const response = await svelteKitHandler({
    event,
    resolve: async (event) => {
      // For non-auth routes, fetch session and populate locals
      const session = await auth.api.getSession({
        headers: event.request.headers,
      });

      if (session) {
        event.locals.session = session.session;
        event.locals.user = session.user;
      }

      return resolve(event);
    },
    auth,
    building,
  });

  console.log(`[HOOK] Response status: ${response.status}`);
  console.log(
    `[HOOK] Response headers:`,
    Object.fromEntries(response.headers.entries())
  );

  return response;
};
