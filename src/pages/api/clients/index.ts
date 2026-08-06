import type { APIRoute } from 'astro';
import { db } from '../../../lib/db/index';
import { clients, instances } from '../../../lib/schema/schema';

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

    const cleanCode = code.toUpperCase().trim();

    const result = await db
      .insert(clients)
      .values({
        code: cleanCode,
        name: name.trim(),
      })
      .returning();

    const newClient = result[0];

    // Crear automáticamente los ambientes por defecto: BASE, UAT, LIVE
    // Cada ambiente tiene 2 capas fijas: Clínica (trakcare) e Integraciones (integration)
    const defaultEnvironments = ['BASE', 'UAT', 'LIVE'];
    for (const env of defaultEnvironments) {
      // 1. Capa Clínica (TrakCare)
      await db.insert(instances).values({
        clientId: newClient.id,
        environment: env,
        layer: 'trakcare',
        namespace: `${env}-${cleanCode}`,
        authType: 'userpass',
      });

      // 2. Capa Integraciones (INT)
      await db.insert(instances).values({
        clientId: newClient.id,
        environment: env,
        layer: 'integration',
        namespace: 'INT',
        authType: 'userpass',
      });
    }

    return new Response(JSON.stringify(newClient), {
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
