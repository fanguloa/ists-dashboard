import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('🧹 Cleaning database to keep only ACHS project as test example...\n');

// 1. Delete all non-ACHS clients
const deletedClients = db.prepare("DELETE FROM clients WHERE code != 'ACHS'").run();
console.log(`✓ Deleted ${deletedClients.changes} non-ACHS clients`);

// 2. Ensure ACHS client exists with complete links
let achs = db.prepare("SELECT * FROM clients WHERE code = 'ACHS'").get() as any;

if (!achs) {
  const insert = db.prepare(`
    INSERT INTO clients (code, name, vpn_type, vpn_host, vpn_range, folder_path, ccr_url)
    VALUES ('ACHS', 'Asociación Chilena de Seguridad', 'globalprotect', 'vpnprov.achs.cl', '10.244.0.0/16', 'C:\\Proyectos\\ACHS', 'https://ccr.intersystems.com/ccr/ng/details/system/ACHS/T2026')
  `).run();
  achs = db.prepare("SELECT * FROM clients WHERE code = 'ACHS'").get() as any;
} else {
  db.prepare(`
    UPDATE clients
    SET name = 'Asociación Chilena de Seguridad',
        vpn_type = 'globalprotect',
        vpn_host = 'vpnprov.achs.cl',
        vpn_range = '10.244.0.0/16',
        folder_path = 'C:\\Proyectos\\ACHS',
        ccr_url = 'https://ccr.intersystems.com/ccr/ng/details/system/ACHS/T2026'
    WHERE id = ?
  `).run(achs.id);
}

// 3. Ensure ACHS has BASE and UAT instances with sample multi-credentials
db.prepare('DELETE FROM instances WHERE client_id = ?').run(achs.id);

const baseCredentials = JSON.stringify([
  { id: 'c1', label: 'Administrador _SYSTEM', type: 'userpass', username: '_SYSTEM', password: 'SYS' },
  { id: 'c2', label: 'SuperUser TrakCare', type: 'userpass', username: 'SuperUser', password: 'SYS' },
  { id: 'c3', label: 'SSO Azure AD', type: 'sso', ssoProvider: 'azure', ssoUrl: 'https://login.microsoftonline.com/' },
]);

const uatCredentials = JSON.stringify([
  { id: 'c4', label: 'Usuario T2026', type: 'userpass', username: 'achsuat', password: 'UAT2026Password!' },
  { id: 'c5', label: 'Acceso Público UAT', type: 'none' },
]);

// BASE TrakCare layer
db.prepare(`
  INSERT INTO instances (client_id, environment, layer, namespace, gateway_url, smp_path, trakcare_path, auth_type, username, password, credentials, requires_vpn)
  VALUES (?, 'BASE', 'trakcare', 'BASE-ACHS', 'https://10.244.20.6', '/csp/sys/%25CSP.Portal.Home.zen', '/csp/system.Home.cls', 'userpass', '_SYSTEM', 'SYS', ?, 1)
`).run(achs.id, baseCredentials);

// BASE Integration layer
db.prepare(`
  INSERT INTO instances (client_id, environment, layer, namespace, gateway_url, smp_path, trakcare_path, auth_type, username, password, credentials, requires_vpn)
  VALUES (?, 'BASE', 'integration', 'INT', 'https://10.244.20.6', '/csp/sys/%25CSP.Portal.Home.zen', '/csp/system.Home.cls', 'userpass', '_SYSTEM', 'SYS', ?, 1)
`).run(achs.id, baseCredentials);

// UAT TrakCare layer
db.prepare(`
  INSERT INTO instances (client_id, environment, layer, namespace, has_ha, gateway_url, node1_url, node2_url, smp_path, trakcare_path, auth_type, username, password, credentials, requires_vpn)
  VALUES (?, 'UAT', 'trakcare', 'UAT-ACHS', 1, 'https://10.244.30.6', 'https://10.244.30.4', 'https://10.244.30.5', '/csp/sys/%25CSP.Portal.Home.zen', '/csp/system.Home.cls', 'userpass', 'achsuat', 'UAT2026Password!', ?, 1)
`).run(achs.id, uatCredentials);

console.log('✓ Configured ACHS instances with test data and multi-credentials!');
console.log('✅ Done!');
db.close();
