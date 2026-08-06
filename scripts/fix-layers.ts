import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('🔄 Restructuring: Ambiente → Capas...\n');

// Agregar columna layer
try {
  db.exec('ALTER TABLE instances ADD COLUMN layer TEXT DEFAULT \'trakcare\'');
  console.log('✓ Layer column added');
} catch (e) {
  console.log('ℹ Layer column already exists');
}

// Normalizar ambientes y capas
const normalizations = [
  // BASE-INT → BASE + integration layer
  { oldEnv: 'BASE-INT', newEnv: 'BASE', layer: 'integration' },
  // UAT-INT → UAT + integration layer
  { oldEnv: 'UAT-INT', newEnv: 'UAT', layer: 'integration' },
  // LIVE-INT → LIVE + integration layer
  { oldEnv: 'LIVE-INT', newEnv: 'LIVE', layer: 'integration' },
];

for (const norm of normalizations) {
  const result = db.prepare(`
    UPDATE instances 
    SET environment = ?, layer = ?
    WHERE environment = ?
  `).run(norm.newEnv, norm.layer, norm.oldEnv);
  
  if (result.changes > 0) {
    console.log(`✓ ${norm.oldEnv} → ${norm.newEnv} (${norm.layer})`);
  }
}

// Marcar instancias trakcare como layer=trakcare
db.prepare(`
  UPDATE instances 
  SET layer = 'trakcare'
  WHERE layer IS NULL OR layer = ''
`).run();

console.log('\n✅ Done! Now each environment has multiple layers.');
db.close();
