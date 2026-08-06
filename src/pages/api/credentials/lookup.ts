import type { APIRoute } from 'astro';
import { db } from '../../../lib/db/index';
import { instances, clients } from '../../../lib/schema/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Falta parámetro url' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Obtener todas las instancias
    const allInstances = await db
      .select({
        id: instances.id,
        clientId: instances.clientId,
        environment: instances.environment,
        layer: instances.layer,
        namespace: instances.namespace,
        hasHA: instances.hasHA,
        gatewayUrl: instances.gatewayUrl,
        node1Url: instances.node1Url,
        node2Url: instances.node2Url,
        smpPath: instances.smpPath,
        trakcarePath: instances.trakcarePath,
        authType: instances.authType,
        username: instances.username,
        password: instances.password,
        credentials: instances.credentials,
        ssoProvider: instances.ssoProvider,
        ssoUrl: instances.ssoUrl,
        clientCode: clients.code,
        clientName: clients.name,
      })
      .from(instances)
      .innerJoin(clients, eq(instances.clientId, clients.id));

    // Buscar instancia que matchee la URL
    const match = allInstances.find((inst) => {
      const urls = [
        inst.gatewayUrl ? inst.gatewayUrl + (inst.trakcarePath || '') : null,
        inst.gatewayUrl ? inst.gatewayUrl + (inst.smpPath || '') : null,
        inst.node1Url ? inst.node1Url + (inst.trakcarePath || '') : null,
        inst.node1Url ? inst.node1Url + (inst.smpPath || '') : null,
        inst.node2Url ? inst.node2Url + (inst.trakcarePath || '') : null,
        inst.node2Url ? inst.node2Url + (inst.smpPath || '') : null,
      ].filter(Boolean);

      return urls.some((u) => targetUrl.startsWith(u as string));
    });

    if (!match) {
      return new Response(
        JSON.stringify({ error: 'No se encontraron credenciales para esta URL' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Construir respuesta
    const response: any = {
      client: {
        code: match.clientCode,
        name: match.clientName,
      },
      instance: {
        id: match.id,
        environment: match.environment,
        layer: match.layer,
        namespace: match.namespace,
      },
      auth: {
        type: match.authType,
      },
    };

    // Agregar credenciales según tipo
    if (match.authType === 'userpass') {
      response.auth.username = match.username;
      response.auth.password = match.password;

      if (match.credentials) {
        try {
          response.auth.accounts = typeof match.credentials === 'string'
            ? JSON.parse(match.credentials)
            : match.credentials;
        } catch {
          response.auth.accounts = [];
        }
      }
    } else if (match.authType === 'sso') {
      response.auth.provider = match.ssoProvider;
      response.auth.ssoUrl = match.ssoUrl;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error consultando credenciales:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
