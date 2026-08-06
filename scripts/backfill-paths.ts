import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('📋 Clientes actuales:\n');
const clients = db.prepare('SELECT * FROM clients').all() as any[];

clients.forEach((c: any) => {
  console.log(`  • ${c.code} - ${c.name}`);
  console.log(`    Git: ${c.git_repo || '(sin configurar)'}`);
  console.log(`    Folder: ${c.folder_path || '(sin configurar)'}\n`);
});

console.log('\n🔄 Actualizando rutas...\n');

// Backfill de rutas basado en el código del proyecto
const updates = [
  {
    code: 'ACHS',
    gitRepo: 'https://github.com/achs/trakcare',
    folderPath: 'C:\\Proyectos\\ACHS',
  },
  // Agrega más proyectos aquí según los que tengas
];

updates.forEach(({ code, gitRepo, folderPath }) => {
  try {
    db.prepare(`
      UPDATE clients 
      SET git_repo = ?, folder_path = ? 
      WHERE code = ?
    `).run(gitRepo, folderPath, code);
    console.log(`✓ Actualizado ${code}`);
  } catch (e: any) {
    console.error(`✗ Error actualizando ${code}:`, e.message);
  }
});

console.log('\n📋 Clientes después de actualizar:\n');
const updatedClients = db.prepare('SELECT * FROM clients').all() as any[];

updatedClients.forEach((c: any) => {
  console.log(`  • ${c.code} - ${c.name}`);
  console.log(`    Git: ${c.git_repo || '(sin configurar)'}`);
  console.log(`    Folder: ${c.folder_path || '(sin configurar)'}\n`);
});

db.close();
console.log('✅ Backfill completado!');
