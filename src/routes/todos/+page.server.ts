import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db";
import { todos } from "$lib/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals, platform }) => {
  // Require authentication - redirect to login if not signed in
  if (!locals.session || !locals.user) {
    throw redirect(302, "/todos/login");
  }

  // Fetch todos directly from database
  const db = getDb(platform!.env.DB);
  const userTodos = await db
    .select()
    .from(todos)
    .where(eq(todos.userId, locals.user.id))
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

  return {
    user: locals.user,
    todos: formattedTodos,
  };
};
