import type { APIRoute } from 'astro';
import { db } from '../../../lib/db/index';
import { instances } from '../../../lib/schema/schema';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      clientId,
      environment,
      layer = 'trakcare',
      namespace,
      hasHA = false,
      gatewayUrl,
      node1Url,
      node2Url,
      node1Role = 'primary',
      node2Role = 'backup',
      smpPath = '/csp/sys/%25CSP.Portal.Home.zen',
      trakcarePath = '/csp/system.Home.cls',
      authType = 'userpass',
      username,
      password,
      credentials,
      ssoProvider,
      ssoUrl,
      createBothLayers = true,
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

    let credentialsJson: string | null = null;
    let primaryUsername = username || null;
    let primaryPassword = password || null;

    if (credentials) {
      credentialsJson = typeof credentials === 'string' ? credentials : JSON.stringify(credentials);
      if (Array.isArray(credentials) && credentials.length > 0) {
        if (!primaryUsername) primaryUsername = credentials[0].username || null;
        if (!primaryPassword) primaryPassword = credentials[0].password || null;
      }
    }

    const cleanEnv = environment.toUpperCase().trim();

    const createdInstances = [];

    // Capa principal
    const result1 = await db
      .insert(instances)
      .values({
        clientId: Number(clientId),
        environment: cleanEnv,
        layer: layer.toLowerCase().trim(),
        namespace: namespace ? namespace.trim() : `${cleanEnv}`,
        hasHA: Boolean(hasHA),
        gatewayUrl: gatewayUrl || null,
        node1Url: node1Url || null,
        node2Url: node2Url || null,
        node1Role: node1Role || 'primary',
        node2Role: node2Role || 'backup',
        smpPath,
        trakcarePath,
        authType,
        username: primaryUsername,
        password: primaryPassword,
        credentials: credentialsJson,
        ssoProvider: ssoProvider || null,
        ssoUrl: ssoUrl || null,
      })
      .returning();

    createdInstances.push(result1[0]);

    // Si createBothLayers es verdadero y solo creamos 1 capa, crear automáticamente la capa opuesta (Clínica o Integraciones)
    if (createBothLayers) {
      const otherLayer = layer.toLowerCase().trim() === 'trakcare' ? 'integration' : 'trakcare';
      const otherNamespace = otherLayer === 'integration' ? 'INT' : `${cleanEnv}`;

      const result2 = await db
        .insert(instances)
        .values({
          clientId: Number(clientId),
          environment: cleanEnv,
          layer: otherLayer,
          namespace: otherNamespace,
          hasHA: Boolean(hasHA),
          gatewayUrl: gatewayUrl || null,
          node1Url: node1Url || null,
          node2Url: node2Url || null,
          node1Role: node1Role || 'primary',
          node2Role: node2Role || 'backup',
          smpPath,
          trakcarePath,
          authType,
          username: primaryUsername,
          password: primaryPassword,
          credentials: credentialsJson,
        })
        .returning();

      createdInstances.push(result2[0]);
    }

    return new Response(JSON.stringify(createdInstances), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creando instancia:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
