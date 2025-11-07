import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "./schema";

// Helper function to create a drizzle instance from a D1 binding
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// Export schema for Better Auth
export { schema };
