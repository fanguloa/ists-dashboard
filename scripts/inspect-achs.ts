import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

const achs = db.prepare("SELECT id FROM clients WHERE code = 'ACHS'").get() as any;
if (achs) {
  const instances = db.prepare('SELECT id, environment, layer, namespace, gateway_url, node1_url, node2_url, credentials FROM instances WHERE client_id = ?').all(achs.id);
  console.log('Instancias de ACHS:', instances);
}

db.close();
