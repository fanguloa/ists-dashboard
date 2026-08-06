import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('🔄 Adding credentials fields...\n');

const fields = [
  { name: 'auth_type', type: 'TEXT DEFAULT \'userpass\'' },
  { name: 'username', type: 'TEXT' },
  { name: 'password', type: 'TEXT' },
  { name: 'sso_provider', type: 'TEXT' },
  { name: 'sso_url', type: 'TEXT' },
];

for (const field of fields) {
  try {
    db.exec(`ALTER TABLE instances ADD COLUMN ${field.name} ${field.type}`);
    console.log(`✓ Added ${field.name}`);
  } catch (e: any) {
    if (e.message.includes('duplicate column')) {
      console.log(`ℹ ${field.name} already exists`);
    } else {
      console.error(`✗ Error adding ${field.name}:`, e.message);
    }
  }
}

console.log('\n✅ Migration completed!');
db.close();
