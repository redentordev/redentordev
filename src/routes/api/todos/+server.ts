import { json, error, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb } from "$lib/server/db";
import { getAuth } from "$lib/server/auth";
import { todos } from "$lib/server/db/schema";
import { eq, desc } from "drizzle-orm";

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

// GET /api/todos - Get all todos
export const GET: RequestHandler = async (event) => {
  const { user, db } = await getAuthenticatedUser(event);

  const userTodos = await db
    .select()
    .from(todos)
    .where(eq(todos.userId, user.id))
    .orderBy(desc(todos.createdAt));

  const formattedTodos = userTodos.map((todo) => ({
    ...todo,
    createdAt:
      todo.createdAt instanceof Date
        ? todo.createdAt.toISOString()
        : new Date(todo.createdAt).toISOString(),
    updatedAt:
      todo.updatedAt instanceof Date
        ? todo.updatedAt.toISOString()
        : new Date(todo.updatedAt).toISOString(),
  }));

  return json(formattedTodos);
};

// POST /api/todos - Create a new todo
export const POST: RequestHandler = async (event) => {
  const { user, db } = await getAuthenticatedUser(event);

  const body = await event.request.json();
  const title = body.title?.trim();

  if (!title || title.length === 0) {
    throw error(400, "Title is required");
  }

  const now = new Date();

  const [newTodo] = await db
    .insert(todos)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      title: title,
      completed: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return json({
    ...newTodo,
    createdAt: newTodo.createdAt instanceof Date ? newTodo.createdAt.toISOString() : new Date(newTodo.createdAt).toISOString(),
    updatedAt: newTodo.updatedAt instanceof Date ? newTodo.updatedAt.toISOString() : new Date(newTodo.updatedAt).toISOString(),
  });
};

