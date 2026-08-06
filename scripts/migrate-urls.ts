import { db } from '../src/lib/db/index';
import { instances, clients } from '../src/lib/schema/schema';
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

// Extrae bookmarks de ACHS (10.244.x.x)
function extractAchsUrls(node: any): { name: string; url: string }[] {
  const results: { name: string; url: string }[] = [];

  if (node.type === 'url' && node.url?.includes('10.244')) {
    results.push({
      name: node.name || '',
      url: node.url,
    });
  }

  if (node.type === 'folder' && node.children) {
    for (const child of node.children) {
      results.push(...extractAchsUrls(child));
    }
  }

  return results;
}

// Detecta ambiente, layer, y URLs desde un bookmark
function parseBookmark(bookmark: { name: string; url: string }): {
  environment: string | null;
  layer: string | null;
  host: string;
  namespace: string | null;
  smpUrl: string | null;
  isSmp: boolean;
} | null {
  try {
    const url = new URL(bookmark.url);
    const host = url.hostname;
    const path = url.pathname;

    // Detectar ambiente por IP
    let environment: string | null = null;
    if (host.startsWith('10.244.10.')) environment = 'BASE';
    else if (host.startsWith('10.244.20.')) environment = 'UAT';
    else if (host.startsWith('10.244.30.')) environment = 'LIVE';

    // Detectar layer
    let layer: string | null = null;
    let namespace: string | null = null;
    let smpUrl: string | null = null;
    let isSmp = false;

    if (path.includes('/intbase') || path.includes('/intuat') || path.includes('/intlive')) {
      layer = 'integration';
      const match = path.match(/\/(int[^/]+)\//);
      if (match) namespace = match[1].toUpperCase();
    } else if (path.includes('/trakbase') || path.includes('/trakuat') || path.includes('/traklive')) {
      layer = 'trakcare';
      const match = path.match(/\/(trak[^/]+)\//);
      if (match) namespace = match[1];
    } else if (path.includes('/clacbase') || path.includes('/clacuat') || path.includes('/claclive')) {
      layer = 'trakcare';
      const match = path.match(/\/(clac[^/]+)\//);
      if (match) namespace = match[1];
    } else if (
      path.includes('/csp/sys/') &&
      (path.includes('UtilHome') || path.includes('Portal') || path.includes('%25CSP'))
    ) {
      layer = 'smp';
      isSmp = true;
      // Extraer path completo desde /csp/sys/ en adelante
      const smpMatch = path.match(/(\/csp\/sys\/.+)$/);
      if (smpMatch) smpUrl = smpMatch[1];
    }

    if (!environment || !layer) return null;

    return {
      environment,
      layer,
      host,
      namespace,
      smpUrl,
      isSmp,
    };
  } catch {
    return null;
  }
}

async function migrateUrls() {
  console.log('🔄 Migrating URLs from Chrome bookmarks...\n');

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

  const achsUrls = extractAchsUrls(bookmarks.roots.bookmark_bar);
  console.log(`Found ${achsUrls.length} ACHS bookmarks\n`);

  // Agrupar por ambiente + layer
  const grouped = new Map<string, { host: string; namespace: string | null; smpUrl: string | null }[]>();

  for (const bookmark of achsUrls) {
    const parsed = parseBookmark(bookmark);
    if (!parsed) continue;

    const key = `${parsed.environment}-${parsed.layer}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push({
      host: parsed.host,
      namespace: parsed.namespace,
      smpUrl: parsed.smpUrl,
    });
  }

  // Obtener todas las instancias de ACHS
  const allClients = await db.select().from(clients);
  const achsClient = allClients.find((c) => c.code === 'ACHS');

  if (!achsClient) {
    console.error('❌ Cliente ACHS no encontrado');
    process.exit(1);
  }

  const achsInstances = await db.select().from(instances);
  const filteredInstances = achsInstances.filter((i) => i.clientId === achsClient.id);

  let updated = 0;

  for (const inst of filteredInstances) {
    const key = `${inst.environment}-${inst.layer}`;
    const matches = grouped.get(key);

    if (!matches || matches.length === 0) continue;

    // Para TrakCare/Integration: usar el host del bookmark
    if (inst.layer === 'trakcare' || inst.layer === 'integration') {
      const match = matches.find((m) => m.namespace?.toLowerCase() === inst.namespace?.toLowerCase());
      if (match) {
        // Si es UAT o LIVE, asignar gateway y nodos
        if (inst.environment === 'UAT' || inst.environment === 'LIVE') {
          await db
            .update(instances)
            .set({
              gatewayUrl: `http://${match.host}`,
              smpUrl: '/csp/sys/%25CSP.Portal.Home.zen', // Path estándar SMP
            })
            .where(eq(instances.id, inst.id));
          console.log(`✓ ${inst.environment} ${inst.layer} (${inst.namespace}): gateway http://${match.host}`);
        } else {
          // BASE: solo URL directa
          await db
            .update(instances)
            .set({
              gatewayUrl: `http://${match.host}`,
              smpUrl: '/csp/sys/%25CSP.Portal.Home.zen',
            })
            .where(eq(instances.id, inst.id));
          console.log(`✓ ${inst.environment} ${inst.layer} (${inst.namespace}): http://${match.host}`);
        }
        updated++;
      }
    }

    // Para SMP: extraer path del bookmark
    if (inst.layer === 'smp') {
      const smpMatch = matches.find((m) => m.smpUrl);
      if (smpMatch) {
        await db
          .update(instances)
          .set({
            gatewayUrl: `http://${smpMatch.host}`,
            smpUrl: smpMatch.smpUrl,
          })
          .where(eq(instances.id, inst.id));
        console.log(`✓ ${inst.environment} SMP: http://${smpMatch.host}${smpMatch.smpUrl}`);
        updated++;
      }
    }
  }

  console.log(`\n✅ Updated ${updated} instances with URLs from bookmarks`);
  process.exit(0);
}

migrateUrls().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
