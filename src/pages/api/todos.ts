import type { APIRoute } from 'astro';
import { db } from '../../lib/db/index';
import { todos } from '../../lib/schema/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  const clientId = url.searchParams.get('clientId');
  const status = url.searchParams.get('status');

  let query = db.select().from(todos);

  if (clientId) {
    const allTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.clientId, parseInt(clientId)));
    
    return new Response(JSON.stringify(allTodos), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (status) {
    const filteredTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.status, status));
    
    return new Response(JSON.stringify(filteredTodos), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allTodos = await db.select().from(todos);
  return new Response(JSON.stringify(allTodos), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const [newTodo] = await db
      .insert(todos)
      .values({
        clientId: body.clientId || null,
        instanceId: body.instanceId || null,
        title: body.title,
        description: body.description || null,
        status: body.status || 'pending',
        priority: body.priority || 'medium',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      })
      .returning();

    return new Response(JSON.stringify(newTodo), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create todo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const [updatedTodo] = await db
      .update(todos)
      .set({
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      })
      .where(eq(todos.id, body.id))
      .returning();

    return new Response(JSON.stringify(updatedTodo), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update todo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    await db.delete(todos).where(eq(todos.id, body.id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete todo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
