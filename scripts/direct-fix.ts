import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('🔧 Quick fix ACHS URLs...\n');

// Obtener cliente ACHS
const achsClient = db.prepare('SELECT id FROM clients WHERE code = ?').get('ACHS') as { id: number } | undefined;

if (!achsClient) {
  console.error('❌ ACHS client not found');
  process.exit(1);
}

const updates = [
  {
    env: 'BASE',
    layer: 'trakcare',
    namespace: 'BASE-ACHS',
    gatewayUrl: 'http://10.244.10.4',
    smpUrl: '/csp/sys/%25CSP.Portal.Home.zen',
  },
  {
    env: 'BASE-INT',
    layer: 'integration',
    namespace: 'INT',
    gatewayUrl: 'https://10.244.10.4',
    smpUrl: '/csp/sys/%25CSP.Portal.Home.zen',
  },
  {
    env: 'UAT',
    layer: 'trakcare',
    namespace: 'UAT-ACHS',
    gatewayUrl: 'http://10.244.20.6',
    node1Url: 'http://10.244.20.4',
    node2Url: 'http://10.244.20.5',
    smpUrl: '/csp/sys/%25CSP.Portal.Home.zen',
  },
  {
    env: 'UAT-INT',
    layer: 'integration',
    namespace: 'INT',
    gatewayUrl: 'http://10.244.20.6',
    node1Url: 'http://10.244.20.4',
    node2Url: 'http://10.244.20.5',
    smpUrl: '/csp/sys/%25CSP.Portal.Home.zen',
  },
  {
    env: 'LIVE',
    layer: 'trakcare',
    namespace: 'LIVE-ACHS',
    gatewayUrl: 'http://10.244.30.6',
    node1Url: 'http://10.244.30.4',
    node2Url: 'http://10.244.30.5',
    smpUrl: '/csp/sys/%25CSP.Portal.Home.zen',
  },
];

const updateStmt = db.prepare(`
  UPDATE instances 
  SET gateway_url = ?, node1_url = ?, node2_url = ?, smp_url = ?
  WHERE client_id = ? AND environment = ? AND layer = ? AND namespace = ?
`);

let updated = 0;
for (const u of updates) {
  const result = updateStmt.run(
    u.gatewayUrl,
    u.node1Url || null,
    u.node2Url || null,
    u.smpUrl,
    achsClient.id,
    u.env,
    u.layer,
    u.namespace
  );
  if (result.changes > 0) {
    console.log(`✓ Updated ${u.env} ${u.layer} (${u.namespace})`);
    updated++;
  }
}

console.log(`\n✅ Updated ${updated} instances`);
db.close();
