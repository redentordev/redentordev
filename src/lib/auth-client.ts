import { createAuthClient } from "better-auth/svelte";
import { magicLinkClient } from "better-auth/client/plugins";
import { browser } from "$app/environment";

// Get the base URL for Better Auth client
// In browser, use current origin. In SSR, use VITE_AUTH_URL or default to localhost
function getBaseURL(): string {
  let url: string;
  if (browser) {
    // Use current origin in browser (works for both dev and prod)
    url = window.location.origin;
  } else {
    // During SSR, use environment variable or default
    url = import.meta.env.VITE_AUTH_URL || "http://localhost:5173";
  }
  // Remove trailing slash if present
  return url.replace(/\/$/, "");
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [magicLinkClient()],
});

export const { signIn, signOut, signUp, useSession, magicLink } = authClient;
