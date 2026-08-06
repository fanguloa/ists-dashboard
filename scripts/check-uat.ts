import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'trakcontrol.db');
const db = new Database(dbPath);

const rows = db
  .prepare(
    `SELECT id, environment, layer, namespace, gateway_url, node1_url, node2_url 
     FROM instances 
     WHERE client_id = 1 AND environment = 'UAT' 
     ORDER BY layer`
  )
  .all();

console.table(rows);

db.close();
