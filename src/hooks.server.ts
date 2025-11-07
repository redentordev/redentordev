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
  const auth = getAuth(db);

  // Fetch current session from Better Auth
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  // Make session and user available on server
  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  return svelteKitHandler({ event, resolve, auth, building });
};

