import { db } from '../src/lib/db/index';
import { clients, quickLinks } from '../src/lib/schema/schema';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';

interface BookmarkNode {
  type: 'url' | 'folder';
  name?: string;
  url?: string;
  children?: BookmarkNode[];
}

interface ChromeBookmarks {
  roots: {
    bookmark_bar: {
      children: any[];
    };
  };
}

// Detecta cliente por URL
function detectClientFromUrl(url: string): string | null {
  const lowerUrl = url.toLowerCase();

  // IPs privadas de ACHS
  if (lowerUrl.includes('10.244.')) return 'ACHS';
  
  // Dominios conocidos
  if (lowerUrl.includes('clme.cl')) return 'CLME';
  if (lowerUrl.includes('clua.cl')) return 'CLUA';
  if (lowerUrl.includes('cluc.cl')) return 'CLUC';
  if (lowerUrl.includes('sdcq.cl')) return 'SDCQ';
  if (lowerUrl.includes('sdsr.cl')) return 'SDSR';
  if (lowerUrl.includes('sdtl.cl')) return 'SDTL';
  if (lowerUrl.includes('sdvn.cl')) return 'SDVN2025';
  if (lowerUrl.includes('redsalud.cl')) return 'CLRS';

  // Genéricos (asignar a null para quick links globales)
  if (
    lowerUrl.includes('ccr.intersystems.com') ||
    lowerUrl.includes('confluence') ||
    lowerUrl.includes('atlassian') ||
    lowerUrl.includes('sharepoint') ||
    lowerUrl.includes('intersystems')
  ) {
    return null; // Global
  }

  return null;
}

// Detecta categoría por URL/nombre
function detectCategory(url: string, name: string): string {
  const lowerUrl = url.toLowerCase();
  const lowerName = name.toLowerCase();

  if (lowerUrl.includes('ccr.intersystems.com') || lowerName.includes('ccr')) {
    return 'ccr';
  }
  if (lowerUrl.includes('confluence') || lowerName.includes('confluence')) {
    return 'confluence';
  }
  if (lowerUrl.includes('atlassian.net') || lowerName.includes('jira')) {
    return 'jira';
  }
  if (lowerUrl.includes('sharepoint') || lowerName.includes('sharepoint')) {
    return 'sharepoint';
  }
  if (lowerUrl.includes('dropbox')) {
    return 'dropbox';
  }

  return 'custom';
}

function extractBookmarksFromNode(
  node: any,
  parentFolder: string | null = null
): { clientCode: string | null; name: string; url: string; category: string }[] {
  const results: { clientCode: string | null; name: string; url: string; category: string }[] = [];

  if (node.type === 'url' && node.url) {
    const category = detectCategory(node.url, node.name || '');
    const clientCode = detectClientFromUrl(node.url);
    
    results.push({
      clientCode,
      name: node.name || 'Sin título',
      url: node.url,
      category,
    });
  }

  if (node.type === 'folder' && node.children) {
    const folderName = node.name?.toUpperCase();
    for (const child of node.children) {
      results.push(...extractBookmarksFromNode(child, folderName || parentFolder));
    }
  }

  return results;
}

async function importBookmarks() {
  console.log('📚 Importing Chrome bookmarks...');

  const bookmarksPath = join(
    process.env.LOCALAPPDATA!,
    'Google',
    'Chrome',
    'User Data',
    'Default',
    'Bookmarks'
  );

  const bookmarksRaw = readFileSync(bookmarksPath, 'utf-8');
  const bookmarks: ChromeBookmarks = JSON.parse(bookmarksRaw);

  const allBookmarks = extractBookmarksFromNode(bookmarks.roots.bookmark_bar);

  console.log(`Found ${allBookmarks.length} bookmarks`);

  // Obtiene todos los clientes existentes
  const existingClients = await db.select().from(clients);
  const clientCodeMap = new Map(existingClients.map((c) => [c.code, c.id]));

  let imported = 0;
  for (const bookmark of allBookmarks) {
    let clientId: number | null = null;

    // Si tiene cliente asignado, búscalo
    if (bookmark.clientCode) {
      clientId = clientCodeMap.get(bookmark.clientCode) || null;
      if (!clientId) {
        console.log(`  ⚠️  Cliente no encontrado: ${bookmark.clientCode}`);
        continue;
      }
    }

    // Verifica si ya existe
    const existing = await db
      .select()
      .from(quickLinks)
      .where(eq(quickLinks.url, bookmark.url))
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    await db.insert(quickLinks).values({
      clientId,
      title: bookmark.name,
      url: bookmark.url,
      category: bookmark.category,
    });

    imported++;
    const clientLabel = bookmark.clientCode || 'Global';
    console.log(`  ✓ ${clientLabel}: ${bookmark.name} (${bookmark.category})`);
  }

  console.log(`\n✅ Imported ${imported} quick links`);
  process.exit(0);
}

importBookmarks().catch((err) => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
