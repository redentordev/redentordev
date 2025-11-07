import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { magicLink } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { getRequestEvent } from "$app/server";
import { getDb } from "./db";

// Your allowed email - only this email can sign in
const ALLOWED_EMAIL = "valerioreden@gmail.com";

// This will be initialized with the actual DB binding at runtime
let authInstance: ReturnType<typeof betterAuth> | null = null;

export function getAuth(db: ReturnType<typeof getDb>) {
  // Return cached instance if it exists
  if (authInstance) {
    return authInstance;
  }

  authInstance = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    emailAndPassword: {
      enabled: true,
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

            await fetch("https://n8n.redentor.dev/webhook/notify-me", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "tg-notify-api-key": "OvA6ByQiCv8khX",
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
        disableSignUp: true, // Prevent new signups via magic link
      }),
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

  return authInstance;
}
