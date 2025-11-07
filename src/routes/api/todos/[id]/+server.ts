import { json, error, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb } from "$lib/server/db";
import { getAuth } from "$lib/server/auth";
import { todos } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

// Helper function to get authenticated user and database
async function getAuthenticatedUser(event: Parameters<RequestHandler>[0]) {
  if (!event.platform?.env) {
    throw error(500, "Platform environment not available");
  }

  const db = getDb(event.platform.env.DB);
  const baseURL = new URL(event.request.url).origin;

  const auth = getAuth(db, {
    BASE_URL: baseURL,
    TELEGRAM_WEBHOOK_URL: event.platform.env.TELEGRAM_WEBHOOK_URL || "",
    TELEGRAM_API_KEY: event.platform.env.TELEGRAM_API_KEY || "",
    ALLOWED_EMAIL: event.platform.env.ALLOWED_EMAIL || "",
  });

  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  if (!session?.user) {
    throw redirect(302, "/todos/login");
  }

  return { user: session.user, db };
}

// PATCH /api/todos/[id]/toggle - Toggle todo completion
export const PATCH: RequestHandler = async (event) => {
  const { user, db } = await getAuthenticatedUser(event);
  const id = event.params.id;

  if (!id) {
    throw error(400, "Todo ID is required");
  }

  // Get current todo
  const [todo] = await db
    .select()
    .from(todos)
    .where(eq(todos.id, id))
    .limit(1);

  if (!todo || todo.userId !== user.id) {
    throw error(403, "Unauthorized");
  }

  // Toggle completed status
  const [updatedTodo] = await db
    .update(todos)
    .set({
      completed: !todo.completed,
      updatedAt: new Date(),
    })
    .where(eq(todos.id, id))
    .returning();

  return json({
    ...updatedTodo,
    createdAt: updatedTodo.createdAt instanceof Date ? updatedTodo.createdAt.toISOString() : new Date(updatedTodo.createdAt).toISOString(),
    updatedAt: updatedTodo.updatedAt instanceof Date ? updatedTodo.updatedAt.toISOString() : new Date(updatedTodo.updatedAt).toISOString(),
  });
};

// DELETE /api/todos/[id] - Delete a todo
export const DELETE: RequestHandler = async (event) => {
  const { user, db } = await getAuthenticatedUser(event);
  const id = event.params.id;

  if (!id) {
    throw error(400, "Todo ID is required");
  }

  // Verify ownership before deleting
  const [todo] = await db
    .select()
    .from(todos)
    .where(eq(todos.id, id))
    .limit(1);

  if (!todo || todo.userId !== user.id) {
    throw error(403, "Unauthorized");
  }

  await db.delete(todos).where(eq(todos.id, id));

  return json({ success: true });
};

