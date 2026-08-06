import type { APIRoute } from 'astro';
import { db } from '../../../lib/db/index';
import { instances } from '../../../lib/schema/schema';
import { eq } from 'drizzle-orm';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'ID inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { hasHA, gatewayUrl, node1Url, node2Url, node1Role, node2Role, node1Path, node2Path, smpPath, trakcarePath, authType, username, password, credentials, ssoProvider, ssoUrl } = body;

    let credentialsJson: string | null = null;
    let primaryUsername = username || null;
    let primaryPassword = password || null;

    if (credentials) {
      if (typeof credentials === 'string') {
        credentialsJson = credentials;
      } else {
        credentialsJson = JSON.stringify(credentials);
      }

      if (Array.isArray(credentials) && credentials.length > 0) {
        if (!primaryUsername) primaryUsername = credentials[0].username || null;
        if (!primaryPassword) primaryPassword = credentials[0].password || null;
      }
    }

    await db
      .update(instances)
      .set({
        hasHA: hasHA ?? false,
        gatewayUrl: gatewayUrl || null,
        node1Url: node1Url || null,
        node2Url: node2Url || null,
        node1Role: node1Role || 'primary',
        node2Role: node2Role || 'backup',
        node1Path: node1Path || null,
        node2Path: node2Path || null,
        smpPath: smpPath || '/csp/sys/%25CSP.Portal.Home.zen',
        trakcarePath: trakcarePath || '/csp/system.Home.cls',
        authType: authType || 'userpass',
        username: primaryUsername,
        password: primaryPassword,
        credentials: credentialsJson,
        ssoProvider: ssoProvider || null,
        ssoUrl: ssoUrl || null,
      })
      .where(eq(instances.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error actualizando instancia:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
