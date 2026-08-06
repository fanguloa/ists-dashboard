import type { APIRoute } from 'astro';
import { db } from '../../../lib/db/index';
import { instances } from '../../../lib/schema/schema';
import { eq, and } from 'drizzle-orm';

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      clientId,
      environment,
      hasHA,
      gatewayUrl,
      node1Url,
      node2Url,
      node1Role,
      node2Role,
      node1Path,
      node2Path,
      smpPath,
      trakcarePath,
    } = body;

    if (!clientId || !environment) {
      return new Response(
        JSON.stringify({ error: 'clientId y environment son requeridos' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const updates: Record<string, any> = {};
    if (typeof hasHA !== 'undefined') updates.hasHA = Boolean(hasHA);
    if (typeof gatewayUrl !== 'undefined') updates.gatewayUrl = gatewayUrl || null;
    if (typeof node1Url !== 'undefined') updates.node1Url = node1Url || null;
    if (typeof node2Url !== 'undefined') updates.node2Url = node2Url || null;
    if (typeof node1Role !== 'undefined') updates.node1Role = node1Role || 'primary';
    if (typeof node2Role !== 'undefined') updates.node2Role = node2Role || 'backup';
    if (typeof node1Path !== 'undefined') updates.node1Path = node1Path || null;
    if (typeof node2Path !== 'undefined') updates.node2Path = node2Path || null;
    if (typeof smpPath !== 'undefined') updates.smpPath = smpPath || '/csp/sys/%25CSP.Portal.Home.zen';
    if (typeof trakcarePath !== 'undefined') updates.trakcarePath = trakcarePath || '/csp/system.Home.cls';

    await db
      .update(instances)
      .set(updates)
      .where(
        and(
          eq(instances.clientId, Number(clientId)),
          eq(instances.environment, String(environment).toUpperCase().trim())
        )
      );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error actualizando ambiente:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
