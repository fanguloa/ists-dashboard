import type { APIRoute } from 'astro';
import { db } from '../../../lib/db/index';
import { clients } from '../../../lib/schema/schema';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { code, name } = body;

    if (!code || !name) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await db
      .insert(clients)
      .values({
        code: code.toUpperCase(),
        name,
      })
      .returning();

    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creando cliente:', error);
    
    if (error.message?.includes('UNIQUE constraint failed')) {
      return new Response(
        JSON.stringify({ error: 'Ya existe un proyecto con ese código' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
