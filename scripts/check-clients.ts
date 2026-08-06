import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);
const clients = db.prepare('SELECT id, code, name, git_repo, folder_path, ccr_url FROM clients').all();
console.log(JSON.stringify(clients, null, 2));
db.close();
