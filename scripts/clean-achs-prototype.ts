import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'trakcontrol.db');
const db = new Database(dbPath);

console.log('🧼 Setting up ACHS as prototype with clean BASE, UAT, LIVE environments...\n');

// 1. Obtener o crear ACHS
let achs = db.prepare("SELECT id FROM clients WHERE code = 'ACHS'").get() as any;

if (!achs) {
  const insert = db.prepare(`
    INSERT INTO clients (code, name, vpn_type, vpn_host, vpn_range, folder_path, ccr_url)
    VALUES ('ACHS', 'Asociación Chilena de Seguridad', 'globalprotect', 'vpnprov.achs.cl', '10.244.0.0/16', 'C:\\Proyectos\\ACHS', 'https://ccr.intersystems.com/ccr/ng/details/system/ACHS/T2026')
  `).run();
  achs = db.prepare("SELECT id FROM clients WHERE code = 'ACHS'").get() as any;
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

// 2. Limpiar instancias viejas de ACHS
db.prepare('DELETE FROM instances WHERE client_id = ?').run(achs.id);

// 3. Credenciales de prueba
const baseTrakCredentials = JSON.stringify([
  { id: 'c1', label: '_SYSTEM', type: 'userpass', username: '_SYSTEM', password: 'SYS' },
  { id: 'c2', label: 'SuperUser', type: 'userpass', username: 'SuperUser', password: 'SYS' },
  { id: 'c3', label: 'SSO', type: 'sso', ssoProvider: 'azure', ssoUrl: 'https://login.microsoftonline.com/' },
]);

const baseIntCredentials = JSON.stringify([
  { id: 'c4', label: 'Integration Admin', type: 'userpass', username: '_SYSTEM', password: 'SYS' },
]);

const uatTrakCredentials = JSON.stringify([
  { id: 'c5', label: 'Usuario UAT', type: 'userpass', username: 'achsuat', password: 'UAT2026Password!' },
  { id: 'c6', label: 'Acceso Público', type: 'none' },
]);

const liveTrakCredentials = JSON.stringify([
  { id: 'c7', label: 'Admin Producción', type: 'userpass', username: 'achsadmin', password: 'Live2026Secure!' },
  { id: 'c8', label: 'Azure AD SSO', type: 'sso', ssoProvider: 'azure', ssoUrl: 'https://login.microsoftonline.com/' },
]);

// 4. Insertar instancias únicamente para BASE, UAT y LIVE

// BASE - TrakCare
db.prepare(`
  INSERT INTO instances (client_id, environment, layer, namespace, gateway_url, smp_path, trakcare_path, auth_type, username, password, credentials, requires_vpn)
  VALUES (?, 'BASE', 'trakcare', 'BASE-ACHS', 'https://10.244.10.6', '/csp/sys/%25CSP.Portal.Home.zen', '/csp/system.Home.cls', 'userpass', '_SYSTEM', 'SYS', ?, 1)
`).run(achs.id, baseTrakCredentials);

// BASE - Integration
db.prepare(`
  INSERT INTO instances (client_id, environment, layer, namespace, gateway_url, smp_path, trakcare_path, auth_type, username, password, credentials, requires_vpn)
  VALUES (?, 'BASE', 'integration', 'INT', 'https://10.244.10.6', '/csp/sys/%25CSP.Portal.Home.zen', '/csp/system.Home.cls', 'userpass', '_SYSTEM', 'SYS', ?, 1)
`).run(achs.id, baseIntCredentials);

// UAT - TrakCare (HA)
db.prepare(`
  INSERT INTO instances (client_id, environment, layer, namespace, has_ha, gateway_url, node1_url, node2_url, node1_role, node2_role, smp_path, trakcare_path, auth_type, username, password, credentials, requires_vpn)
  VALUES (?, 'UAT', 'trakcare', 'UAT-ACHS', 1, 'https://10.244.20.6', 'https://10.244.20.4', 'https://10.244.20.5', 'primary', 'backup', '/csp/sys/%25CSP.Portal.Home.zen', '/csp/system.Home.cls', 'userpass', 'achsuat', 'UAT2026Password!', ?, 1)
`).run(achs.id, uatTrakCredentials);

// UAT - Integration (HA)
db.prepare(`
  INSERT INTO instances (client_id, environment, layer, namespace, has_ha, gateway_url, node1_url, node2_url, node1_role, node2_role, smp_path, trakcare_path, auth_type, username, password, credentials, requires_vpn)
  VALUES (?, 'UAT', 'integration', 'INT', 1, 'https://10.244.20.6', 'https://10.244.20.4', 'https://10.244.20.5', 'primary', 'backup', '/csp/sys/%25CSP.Portal.Home.zen', '/csp/system.Home.cls', 'userpass', 'achsuat', 'UAT2026Password!', ?, 1)
`).run(achs.id, uatTrakCredentials);

// LIVE - TrakCare (HA)
db.prepare(`
  INSERT INTO instances (client_id, environment, layer, namespace, has_ha, gateway_url, node1_url, node2_url, node1_role, node2_role, smp_path, trakcare_path, auth_type, username, password, credentials, requires_vpn)
  VALUES (?, 'LIVE', 'trakcare', 'LIVE-ACHS', 1, 'https://10.244.30.6', 'https://10.244.30.4', 'https://10.244.30.5', 'primary', 'backup', '/csp/sys/%25CSP.Portal.Home.zen', '/csp/system.Home.cls', 'userpass', 'achsadmin', 'Live2026Secure!', ?, 1)
`).run(achs.id, liveTrakCredentials);

// LIVE - Integration (HA)
db.prepare(`
  INSERT INTO instances (client_id, environment, layer, namespace, has_ha, gateway_url, node1_url, node2_url, node1_role, node2_role, smp_path, trakcare_path, auth_type, username, password, credentials, requires_vpn)
  VALUES (?, 'LIVE', 'integration', 'INT', 1, 'https://10.244.30.6', 'https://10.244.30.4', 'https://10.244.30.5', 'primary', 'backup', '/csp/sys/%25CSP.Portal.Home.zen', '/csp/system.Home.cls', 'userpass', 'achsadmin', 'Live2026Secure!', ?, 1)
`).run(achs.id, liveTrakCredentials);

console.log('✓ ACHS configured cleanly with BASE, UAT, LIVE environments!');
console.log('✅ Prototype setup completed!');
db.close();
