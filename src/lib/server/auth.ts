import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { magicLink } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { getRequestEvent } from "$app/server";
import { getDb } from "./db";

// This will be initialized with the actual DB binding at runtime
// Don't cache the auth instance since BASE_URL and other env vars may change
export function getAuth(
  db: ReturnType<typeof getDb>,
  env: {
    TELEGRAM_WEBHOOK_URL: string;
    TELEGRAM_API_KEY: string;
    ALLOWED_EMAIL: string;
    BASE_URL: string;
  }
) {
  const { TELEGRAM_WEBHOOK_URL, TELEGRAM_API_KEY, ALLOWED_EMAIL, BASE_URL } =
    env;

  // Ensure BASE_URL doesn't have trailing slash
  const baseURL = BASE_URL?.replace(/\/$/, "") || "http://localhost:5173";

  return betterAuth({
    baseURL: baseURL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    emailAndPassword: {
      enabled: false,
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url, token }) => {
          // Log to console for debugging
          console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 MAGIC LINK FOR: ${email}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Click this link to sign in:
${url}

Token: ${token}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          `);

          // Send notification to Telegram via n8n webhook
          try {
            const message = `🔐 Magic Link Sign In\n\nEmail: ${email}\n\nClick to sign in:\n${url}\n\nExpires in 5 minutes`;

            await fetch(TELEGRAM_WEBHOOK_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "tg-notify-api-key": TELEGRAM_API_KEY,
              },
              body: JSON.stringify({
                message: message,
              }),
            });

            console.log("✅ Magic link sent to Telegram");
          } catch (error) {
            console.error("❌ Failed to send Telegram notification:", error);
            // Don't throw - still allow the magic link to work via console
          }
        },
        expiresIn: 300, // 5 minutes
        disableSignUp: false, // Allow new users to sign up via magic link
      }),
      // sveltekitCookies must be the last plugin in the array
      sveltekitCookies(getRequestEvent),
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // Restrict all sign-up and sign-in endpoints to only allowed email
        if (
          ctx.path === "/sign-up/email" ||
          ctx.path === "/sign-in/email" ||
          ctx.path === "/sign-in/magic-link"
        ) {
          const email = ctx.body?.email;

          if (email && email !== ALLOWED_EMAIL) {
            throw new APIError("FORBIDDEN", {
              message: "Access restricted. Only authorized users can sign in.",
            });
          }
        }
      }),
    },
  });
}
