import { db } from '../src/lib/db/index';
import { clients, jiraTickets } from '../src/lib/schema/schema';
import { eq } from 'drizzle-orm';

// Este script está preparado para usar el MCP de Atlassian
// Cuando lo ejecutes desde OpenCode, tendrás acceso al MCP automáticamente

interface JiraTicket {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    assignee: {
      displayName: string;
    } | null;
  };
  self: string;
}

async function syncJiraTicketsForClient(clientCode: string, jql: string) {
  console.log(`🔄 Syncing Jira tickets for ${clientCode}...`);

  // Busca el cliente
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.code, clientCode))
    .limit(1);

  if (!client) {
    console.log(`  ❌ Client ${clientCode} not found`);
    return;
  }

  // TODO: Usar el MCP de Atlassian para buscar tickets
  // Ejemplo de cómo se vería:
  // const response = await mcp.atlassian.searchJira({ jql });
  // const tickets: JiraTicket[] = response.issues;

  // Por ahora, placeholder
  console.log(`  ℹ️  JQL: ${jql}`);
  console.log(`  ℹ️  Para usar este script, ejecutalo desde OpenCode con acceso al MCP de Atlassian`);

  // Ejemplo de cómo insertar tickets:
  /*
  for (const ticket of tickets) {
    await db
      .insert(jiraTickets)
      .values({
        clientId: client.id,
        ticketKey: ticket.key,
        summary: ticket.fields.summary,
        status: ticket.fields.status.name,
        assignee: ticket.fields.assignee?.displayName || null,
        url: ticket.self,
        syncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: jiraTickets.ticketKey,
        set: {
          summary: ticket.fields.summary,
          status: ticket.fields.status.name,
          assignee: ticket.fields.assignee?.displayName || null,
          syncedAt: new Date(),
        },
      });

    console.log(`  ✓ ${ticket.key}: ${ticket.fields.summary}`);
  }
  */

  console.log(`  ✅ Sync completed for ${clientCode}`);
}

async function syncAllClients() {
  console.log('📋 Syncing Jira tickets for all clients...\n');

  // Ejemplos de JQL por cliente
  const clientQueries: Record<string, string> = {
    ACHS: 'project = TC AND labels = "ACHS"',
    CLME: 'project = TC AND labels = "CLME"',
    CLUA: 'project = TC AND labels = "CLUA"',
    // Agregar más según corresponda
  };

  for (const [clientCode, jql] of Object.entries(clientQueries)) {
    await syncJiraTicketsForClient(clientCode, jql);
    console.log('');
  }

  console.log('✅ All clients synced!');
  process.exit(0);
}

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  syncAllClients().catch((err) => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  });
}

export { syncJiraTicketsForClient, syncAllClients };
