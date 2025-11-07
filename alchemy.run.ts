import alchemy from "alchemy";
import { SvelteKit, Worker, D1Database } from "alchemy/cloudflare";

const app = await alchemy("redentordev");

export const database = await D1Database(`sqlite`, {
  name: `${app.name}-${app.stage}-database`,
  migrationsDir: "./migrations",
});

export const worker = await SvelteKit(`site`, {
  name: `${app.name}-${app.stage}-site`,
  domains: ["redentor.dev"],
  bindings: {
    DB: database,
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
