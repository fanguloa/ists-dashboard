import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('🔄 Adding links fields...\n');

const fields = [
  { name: 'git_repo', type: 'TEXT' },
  { name: 'folder_path', type: 'TEXT' },
];

for (const field of fields) {
  try {
    db.exec(`ALTER TABLE clients ADD COLUMN ${field.name} ${field.type}`);
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
