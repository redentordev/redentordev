import "dotenv/config";
import alchemy from "alchemy";
import { SvelteKit, Worker, D1Database } from "alchemy/cloudflare";

// Alchemy.run.ts runs outside SvelteKit, so we use process.env directly
// dotenv/config loads .env files automatically
const app = await alchemy("redentordev", {
  password: process.env.ALCHEMY_PASSWORD,
  adopt: true,
});

export const database = await D1Database(`sqlite`, {
  name: `${app.name}-${app.stage}-database`,
  migrationsDir: "./migrations",
  adopt: true,
});

export const worker = await SvelteKit(`site`, {
  name: `${app.name}-${app.stage}-site`,
  domains: ["redentor.dev"],
  bindings: {
    DB: database,
    BASE_URL:
      app.stage === "prod" ? "https://redentor.dev" : "http://localhost:5173",
    TELEGRAM_WEBHOOK_URL: alchemy.secret(
      process.env.TELEGRAM_WEBHOOK_URL ||
        "https://n8n.redentor.dev/webhook/notify-me"
    ),
    TELEGRAM_API_KEY: alchemy.secret(
      process.env.TELEGRAM_API_KEY || "OvA6ByQiCv8khX"
    ),
    ALLOWED_EMAIL: alchemy.secret(
      process.env.ALLOWED_EMAIL || "valerioreden@gmail.com"
    ),
  },
});

export const redirect = await Worker(`redirect`, {
  name: `${app.name}-${app.stage}-redirect`,
  entrypoint: "./src/redirect.ts",
  domains: ["www.redentor.dev"],
  url: true,
});

console.log({
  url: worker.url,
  redirect: redirect.url,
});

await app.finalize();
