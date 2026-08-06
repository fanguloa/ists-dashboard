import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('🔄 Adding credentials JSON column to instances table...\n');

try {
  db.exec('ALTER TABLE instances ADD COLUMN credentials TEXT');
  console.log('✓ Added credentials column to instances');
} catch (e: any) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ credentials column already exists on instances');
  } else {
    console.error('✗ Error adding credentials:', e.message);
  }
}

const cols = db.pragma('table_info(instances)');
console.log('Current instances columns:', (cols as any[]).map(c => c.name));

console.log('\n✅ Migration completed!');
db.close();
