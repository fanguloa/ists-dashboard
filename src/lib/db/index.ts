import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../schema/schema';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../../data/trakcontrol.db');

const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
