import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('🔄 Migrating schema to new architecture...\n');

// Backup de la tabla actual
db.exec('CREATE TABLE instances_backup AS SELECT * FROM instances');
console.log('✓ Backup created');

// Crear nueva tabla
db.exec(`
  CREATE TABLE instances_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    environment TEXT NOT NULL,
    has_ha INTEGER DEFAULT 0,
    gateway_url TEXT,
    node1_url TEXT,
    node2_url TEXT,
    smp_path TEXT DEFAULT '/csp/sys/%25CSP.Portal.Home.zen',
    trakcare_path TEXT DEFAULT '/csp/system.Home.cls',
    namespace TEXT,
    notes TEXT,
    requires_vpn INTEGER DEFAULT 1,
    created_at INTEGER
  )
`);
console.log('✓ New table created');

// Migrar datos existentes
db.exec(`
  INSERT INTO instances_new (
    id, client_id, environment, gateway_url, node1_url, node2_url, 
    smp_path, namespace, notes, requires_vpn, created_at, has_ha
  )
  SELECT 
    id, client_id, environment, gateway_url, node1_url, node2_url,
    COALESCE(smp_url, '/csp/sys/%25CSP.Portal.Home.zen'),
    namespace, notes, requires_vpn, created_at,
    CASE WHEN node1_url IS NOT NULL AND node2_url IS NOT NULL THEN 1 ELSE 0 END
  FROM instances
`);
console.log('✓ Data migrated');

// Reemplazar tabla
db.exec('DROP TABLE instances');
db.exec('ALTER TABLE instances_new RENAME TO instances');
console.log('✓ Table replaced');

// Agregar campos VPN a clients
try {
  db.exec('ALTER TABLE clients ADD COLUMN vpn_type TEXT');
  db.exec('ALTER TABLE clients ADD COLUMN vpn_host TEXT');
  console.log('✓ VPN fields added to clients');
} catch (e) {
  console.log('ℹ VPN fields already exist');
}

console.log('\n✅ Migration completed!');
db.close();
