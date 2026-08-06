import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('🔄 Adding HA node role columns to instances table...\n');

try {
  db.exec("ALTER TABLE instances ADD COLUMN node1_role TEXT DEFAULT 'primary'");
  console.log('✓ Added node1_role');
} catch (e: any) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ node1_role column already exists');
  } else {
    console.error('✗ Error adding node1_role:', e.message);
  }
}

try {
  db.exec("ALTER TABLE instances ADD COLUMN node2_role TEXT DEFAULT 'backup'");
  console.log('✓ Added node2_role');
} catch (e: any) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ node2_role column already exists');
  } else {
    console.error('✗ Error adding node2_role:', e.message);
  }
}

const cols = db.pragma('table_info(instances)');
console.log('Current instances columns:', (cols as any[]).map(c => c.name));

console.log('\n✅ Migration completed!');
db.close();
