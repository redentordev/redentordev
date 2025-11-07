import type { PageServerLoad, Actions } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db";
import { todos } from "$lib/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals, platform }) => {
  // Require authentication - redirect to login if not signed in
  if (!locals.session || !locals.user) {
    throw redirect(302, "/todos/login");
  }

  // Get todos for the current user
  const db = getDb(platform!.env.DB);
  const userTodos = await db
    .select()
    .from(todos)
    .where(eq(todos.userId, locals.user.id))
    .orderBy(desc(todos.createdAt));

  return {
    user: locals.user,
    todos: userTodos.map((todo) => ({
      ...todo,
      createdAt:
        todo.createdAt instanceof Date
          ? todo.createdAt
          : new Date(todo.createdAt),
      updatedAt:
        todo.updatedAt instanceof Date
          ? todo.updatedAt
          : new Date(todo.updatedAt),
    })),
  };
};

export const actions: Actions = {
  create: async ({ request, locals, platform }) => {
    if (!locals.session || !locals.user) {
      throw redirect(302, "/todos/login");
    }

    const data = await request.formData();
    const title = data.get("title")?.toString();

    if (!title || title.trim().length === 0) {
      return fail(400, { error: "Title is required" });
    }

    const db = getDb(platform!.env.DB);
    const now = new Date();

    await db.insert(todos).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      title: title.trim(),
      completed: false,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },

  toggle: async ({ request, locals, platform }) => {
    if (!locals.session || !locals.user) {
      throw redirect(302, "/todos/login");
    }

    const data = await request.formData();
    const id = data.get("id")?.toString();

    if (!id) {
      return fail(400, { error: "Todo ID is required" });
    }

    const db = getDb(platform!.env.DB);

    // Get current todo
    const [todo] = await db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .limit(1);

    if (!todo || todo.userId !== locals.user.id) {
      return fail(403, { error: "Unauthorized" });
    }

    // Toggle completed status
    await db
      .update(todos)
      .set({
        completed: !todo.completed,
        updatedAt: new Date(),
      })
      .where(eq(todos.id, id));

    return { success: true };
  },

  delete: async ({ request, locals, platform }) => {
    if (!locals.session || !locals.user) {
      throw redirect(302, "/todos/login");
    }

    const data = await request.formData();
    const id = data.get("id")?.toString();

    if (!id) {
      return fail(400, { error: "Todo ID is required" });
    }

    const db = getDb(platform!.env.DB);

    // Verify ownership before deleting
    const [todo] = await db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .limit(1);

    if (!todo || todo.userId !== locals.user.id) {
      return fail(403, { error: "Unauthorized" });
    }

    await db.delete(todos).where(eq(todos.id, id));

    return { success: true };
  },
};
