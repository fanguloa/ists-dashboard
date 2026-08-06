import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('🔄 Migrando URLs a HTTPS...\n');

// Obtener todas las instancias con http://
const instances = db
  .prepare(
    `SELECT id, gateway_url, node1_url, node2_url 
     FROM instances 
     WHERE gateway_url LIKE 'http://%' 
        OR node1_url LIKE 'http://%' 
        OR node2_url LIKE 'http://%'`
  )
  .all() as Array<{
    id: number;
    gateway_url: string | null;
    node1_url: string | null;
    node2_url: string | null;
  }>;

console.log(`📊 Encontradas ${instances.length} instancias con http://\n`);

if (instances.length === 0) {
  console.log('✅ Todas las URLs ya usan https://');
  db.close();
  process.exit(0);
}

const updateStmt = db.prepare(`
  UPDATE instances 
  SET gateway_url = ?, node1_url = ?, node2_url = ?
  WHERE id = ?
`);

let updated = 0;

for (const instance of instances) {
  const gatewayUrl = instance.gateway_url?.replace('http://', 'https://') || null;
  const node1Url = instance.node1_url?.replace('http://', 'https://') || null;
  const node2Url = instance.node2_url?.replace('http://', 'https://') || null;

  updateStmt.run(gatewayUrl, node1Url, node2Url, instance.id);
  updated++;

  console.log(`✅ Instancia ${instance.id}:`);
  if (instance.gateway_url && instance.gateway_url.startsWith('http://')) {
    console.log(`   Gateway: ${instance.gateway_url} → ${gatewayUrl}`);
  }
  if (instance.node1_url && instance.node1_url.startsWith('http://')) {
    console.log(`   Nodo 1: ${instance.node1_url} → ${node1Url}`);
  }
  if (instance.node2_url && instance.node2_url.startsWith('http://')) {
    console.log(`   Nodo 2: ${instance.node2_url} → ${node2Url}`);
  }
  console.log();
}

console.log(`\n✅ ${updated} instancias migradas a HTTPS`);

db.close();
