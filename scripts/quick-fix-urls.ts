import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/lib/schema/schema';

const client = createClient({ url: 'file:./data/trakcontrol.db' });
const db = drizzle(client, { schema });

async function quickFix() {
  console.log('🔧 Fixing ACHS URLs...\n');

  // BASE: 10.244.10.4
  // UAT: 10.244.20.6 (gateway), .4 y .5 (nodos)
  // LIVE: 10.244.30.x

  const updates = [
    // BASE TrakCare
    {
      env: 'BASE',
      layer: 'trakcare',
      namespace: 'trakbase01',
      gatewayUrl: 'http://10.244.10.4',
      smpUrl: '/csp/sys/%25CSP.Portal.Home.zen',
    },
    // BASE Integration
    {
      env: 'BASE',
      layer: 'integration',
      namespace: 'intbase01',
      gatewayUrl: 'https://10.244.10.4',
      smpUrl: '/csp/sys/%25CSP.Portal.Home.zen',
    },
    // UAT TrakCare
    {
      env: 'UAT',
      layer: 'trakcare',
      namespace: 'trakuat02',
      gatewayUrl: 'http://10.244.20.6',
      node1Url: 'http://10.244.20.4',
      node2Url: 'http://10.244.20.5',
      smpUrl: '/csp/sys/%25CSP.Portal.Home.zen',
    },
    // UAT Integration
    {
      env: 'UAT',
      layer: 'integration',
      namespace: 'intuat02',
      gatewayUrl: 'http://10.244.20.6',
      node1Url: 'http://10.244.20.4',
      node2Url: 'http://10.244.20.5',
      smpUrl: '/csp/sys/%25CSP.Portal.Home.zen',
    },
  ];

  const allInstances = await db.query.instances.findMany();
  const achsClient = await db.query.clients.findFirst({
    where: (clients, { eq }) => eq(clients.code, 'ACHS'),
  });

  if (!achsClient) {
    console.error('❌ ACHS client not found');
    return;
  }

  for (const update of updates) {
    const inst = allInstances.find(
      (i) =>
        i.clientId === achsClient.id &&
        i.environment === update.env &&
        i.layer === update.layer &&
        i.namespace === update.namespace
    );

    if (inst) {
      await db
        .update(schema.instances)
        .set({
          gatewayUrl: update.gatewayUrl,
          node1Url: update.node1Url || null,
          node2Url: update.node2Url || null,
          smpUrl: update.smpUrl,
        })
        .where(schema.instances.id.eq(inst.id));

      console.log(`✓ Updated ${update.env} ${update.layer} (${update.namespace})`);
    }
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

quickFix().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
