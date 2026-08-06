import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  vpnRange: text('vpn_range'),
  vpnType: text('vpn_type'), // 'cisco', 'globalprotect', 'forticlient', 'rdp', 'openvpn'
  vpnHost: text('vpn_host'), // Host/IP del VPN
  gitRepo: text('git_repo'), // URL del repo git
  folderPath: text('folder_path'), // Path local del proyecto
  ccrUrl: text('ccr_url'), // URL del CCR (Control de Cambios)
  color: text('color'),
  icon: text('icon'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const instances = sqliteTable('instances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  environment: text('environment').notNull(), // BASE, DEV, TEST, UAT, LIVE, SCRATCH
  layer: text('layer').notNull().default('trakcare'), // trakcare, integration, smp
  
  // Alta disponibilidad (2 nodos para UAT, TEST, LIVE)
  hasHA: integer('has_ha', { mode: 'boolean' }).default(false),
  gatewayUrl: text('gateway_url'), // URL del gateway/balanceador (ej: http://10.244.20.6)
  node1Url: text('node1_url'), // Nodo 1 (ej: http://10.244.20.4)
  node2Url: text('node2_url'), // Nodo 2 (ej: http://10.244.20.5)
  
  // Paths de acceso
  smpPath: text('smp_path').default('/csp/sys/%25CSP.Portal.Home.zen'), // Portal IRIS
  trakcarePath: text('trakcare_path').default('/csp/system.Home.cls'), // App clínica
  
  // Credenciales
  authType: text('auth_type').default('userpass'), // 'userpass', 'sso', 'none'
  username: text('username'),
  password: text('password'), // Encriptada en producción
  credentials: text('credentials'), // JSON con lista de múltiples credenciales: [{ id, label, username, password }]
  ssoProvider: text('sso_provider'), // 'azure', 'okta', 'saml', etc
  ssoUrl: text('sso_url'), // URL de SSO si aplica
  
  // Metadata
  namespace: text('namespace'),
  notes: text('notes'),
  requiresVpn: integer('requires_vpn', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  instanceId: integer('instance_id').references(() => instances.id, { onDelete: 'set null' }),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  priority: text('priority').default('medium'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const jiraTickets = sqliteTable('jira_tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  ticketKey: text('ticket_key').notNull().unique(),
  summary: text('summary'),
  status: text('status'),
  assignee: text('assignee'),
  url: text('url'),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});

export const quickLinks = sqliteTable('quick_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  category: text('category'),
  icon: text('icon'),
});

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  instances: many(instances),
  todos: many(todos),
  jiraTickets: many(jiraTickets),
  quickLinks: many(quickLinks),
}));

export const instancesRelations = relations(instances, ({ one, many }) => ({
  client: one(clients, {
    fields: [instances.clientId],
    references: [clients.id],
  }),
  todos: many(todos),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  client: one(clients, {
    fields: [todos.clientId],
    references: [clients.id],
  }),
  instance: one(instances, {
    fields: [todos.instanceId],
    references: [instances.id],
  }),
}));
