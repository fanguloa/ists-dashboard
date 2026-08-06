import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('🔄 Adding node1_path and node2_path columns to instances table...\n');

try {
  db.exec('ALTER TABLE instances ADD COLUMN node1_path TEXT');
  console.log('✓ Added node1_path');
} catch (e: any) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ node1_path column already exists');
  } else {
    console.error('✗ Error adding node1_path:', e.message);
  }
}

try {
  db.exec('ALTER TABLE instances ADD COLUMN node2_path TEXT');
  console.log('✓ Added node2_path');
} catch (e: any) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ node2_path column already exists');
  } else {
    console.error('✗ Error adding node2_path:', e.message);
  }
}

const cols = db.pragma('table_info(instances)');
console.log('Current instances columns:', (cols as any[]).map(c => c.name));

console.log('\n✅ Migration completed!');
db.close();
