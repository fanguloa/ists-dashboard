import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('🔄 Adding ccr_url field...\n');

try {
  db.exec('ALTER TABLE clients ADD COLUMN ccr_url TEXT');
  console.log('✓ Added ccr_url');
} catch (e: any) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ ccr_url already exists');
  } else {
    console.error('✗ Error adding ccr_url:', e.message);
  }
}

const cols = db.pragma('table_info(clients)');
console.log('Current columns:', (cols as any[]).map(c => c.name));

console.log('\n✅ Migration completed!');
db.close();
