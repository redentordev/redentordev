import { createAuthClient } from "better-auth/svelte";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://localhost:5173",
  plugins: [magicLinkClient()],
});

export const { signIn, signOut, signUp, useSession, magicLink } = authClient;
