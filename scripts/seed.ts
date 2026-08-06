import { db } from '../src/lib/db/index';
import { clients, instances } from '../src/lib/schema/schema';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSON5 from 'json5';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mapeo de códigos a nombres completos
const CLIENT_NAMES: Record<string, string> = {
  ACHS: 'Asociación Chilena de Seguridad',
  CLME: 'Clínica MEDS',
  CLUA: 'Clínica Universidad de los Andes',
  CLUC: 'Clínica UC Christus',
  CLCA: 'Clínica Anglo Americana',
  CLCB: 'Clínica Bíblica',
  CLRS: 'Clínica RedSalud',
  CLXX: 'Region Config',
  SDCQ: 'Servicio de Salud Coquimbo',
  SDSR: 'Servicio de Salud Maule',
  SDTL: 'Servicio de Salud Talcahuano',
  SDVN: 'Servicio de Salud Viña del Mar-Quillota',
  SDOR: 'Servicio de Salud Osorno',
  SMOC: 'Salud Maule Organización Comunitaria',
  HMS: 'HMS',
};

// Colores por cliente (puedes ajustar)
const CLIENT_COLORS: Record<string, string> = {
  ACHS: '#3b82f6',
  CLME: '#10b981',
  CLUA: '#8b5cf6',
  CLUC: '#f59e0b',
  CLCA: '#ef4444',
  CLCB: '#ec4899',
  CLRS: '#06b6d4',
  CLXX: '#6b7280',
  SDCQ: '#14b8a6',
  SDSR: '#f97316',
  SDTL: '#84cc16',
  SDVN: '#a855f7',
  SDOR: '#f43f5e',
  SMOC: '#0ea5e9',
  HMS: '#64748b',
};

interface VSCodeServer {
  description: string;
  password?: string;
  username?: string;
  webServer: {
    host: string;
    port?: number;
    scheme?: string;
    pathPrefix?: string;
  };
}

async function seed() {
  console.log('🌱 Seeding database from VSCode settings...');

  // Lee el settings.json de VSCode
  const vscodeSettingsPath = join(
    process.env.APPDATA!,
    'Code',
    'User',
    'settings.json'
  );

  const settingsRaw = readFileSync(vscodeSettingsPath, 'utf-8');
  const settings = JSON5.parse(settingsRaw);

  const servers: Record<string, VSCodeServer> = settings['intersystems.servers'] || {};

  // Agrupa por cliente
  const clientGroups = new Map<string, { env: string; config: VSCodeServer; serverId: string }[]>();

  for (const [serverId, config] of Object.entries(servers)) {
    // Extrae código de cliente quitando sufijos de ambiente
    // ej: achsbase -> achs, achsbaseint -> achs, clmebaseint -> clme
    let clientCode = serverId
      .replace(/(base|uat|live|preprod|scratch)(int)?(\d+)?$/i, '')
      .toUpperCase();
    
    if (!clientCode || clientCode.length < 2) continue;

    // Detecta el ambiente y si es INT
    let rawEnv = config.description.toUpperCase().trim();
    const isInt = serverId.toLowerCase().includes('int') || rawEnv.includes('INT');

    // Limpia el sufijo -INT para mapear la capa de integración dentro del ambiente principal (BASE, UAT, LIVE)
    let env = rawEnv.replace(/-?INT$/i, '').trim();
    if (!env) env = 'BASE';

    if (!clientGroups.has(clientCode)) {
      clientGroups.set(clientCode, []);
    }

    clientGroups.get(clientCode)!.push({ env, config, serverId, isInt });
  }

  // Inserta clientes e instancias
  for (const [clientCode, instances_] of clientGroups) {
    // Upsert client
    const [client] = await db
      .insert(clients)
      .values({
        code: clientCode,
        name: CLIENT_NAMES[clientCode] || clientCode,
        color: CLIENT_COLORS[clientCode] || '#6b7280',
        vpnRange: clientCode === 'ACHS' ? '10.244.0.0/16' : null,
      })
      .onConflictDoUpdate({
        target: clients.code,
        set: { name: CLIENT_NAMES[clientCode] || clientCode },
      })
      .returning();

    console.log(`✓ Client: ${client.code} (${client.name})`);

    // Inserta instancias
    for (const { env, config, serverId, isInt } of instances_) {
      const { host, port = 80, pathPrefix = '', scheme = 'http' } = config.webServer;

      // Detecta layer por pathPrefix o isInt
      let layer = 'trakcare';
      if (isInt || pathPrefix.toLowerCase().includes('int')) {
        layer = 'integration';
      } else if (serverId.includes('base') && !pathPrefix) {
        layer = 'smp';
      }

      // Detecta namespace
      const namespace =
        layer === 'integration'
          ? 'INT'
          : `${env}-${clientCode}`;

      // Detecta VPN requirement (IPs privadas)
      const requiresVpn = host.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/) !== null;

      await db.insert(instances).values({
        clientId: client.id,
        environment: env,
        layer,
        host,
        port,
        pathPrefix,
        namespace,
        username: config.username || 'fangulo',
        password: config.password || null,
        requiresVpn,
      });

      console.log(`  → ${env} ${layer} (${host}${pathPrefix})`);
    }
  }

  console.log('\n✅ Seed completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
