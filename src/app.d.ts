// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { CloudflareEnv } from "../types/env";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user?: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        image?: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
      session?: {
        id: string;
        expiresAt: Date;
        token: string;
        createdAt: Date;
        updatedAt: Date;
        ipAddress?: string | null;
        userAgent?: string | null;
        userId: string;
      };
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: CloudflareEnv;
    }
  }
}

export {};
