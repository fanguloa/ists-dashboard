# TrakControl - Arquitectura

## Resumen

TrakControl es un dashboard SSR construido con Astro que centraliza el acceso a instancias TrakCare, SMP e Integraciones de InterSystems IRIS, con gestión de TODOs y quick links.

## Decisiones de Arquitectura

### 1. **Astro SSR en vez de SPA**

**¿Por qué?**
- Carga inicial más rápida (HTML renderizado en server)
- SEO-friendly (aunque no sea crítico aquí)
- Mejor para datos dinámicos (DB queries en el servidor)
- Islands architecture: solo hidrata componentes interactivos (React)

**Alternativas consideradas:**
- Next.js: Más pesado para un dashboard local
- Vite + React SPA: Sin SSR, toda la lógica en cliente

### 2. **SQLite en vez de Postgres**

**¿Por qué?**
- Zero config: un archivo `.db`, no daemon
- Portabilidad: commiteable (opcional) o en `.gitignore`
- Suficiente para un dashboard personal (<1000 registros)
- Drizzle ORM funciona igual que con Postgres

**Migración futura:**
- Turso (SQLite distribuido) si querés sincronizar entre máquinas
- Postgres si escala a uso multi-usuario

### 3. **Drizzle ORM en vez de Prisma**

**¿Por qué?**
- Más ligero (~2MB vs ~30MB)
- SQL-like API (más cercano al metal)
- Mejor con SQLite
- Migraciones más simples

### 4. **React para componentes, Astro para páginas**

**¿Por qué?**
- Astro maneja el SSR y routing
- React solo en componentes interactivos (Dashboard, Modals, Search)
- Menos JavaScript enviado al cliente

### 5. **API Routes en vez de tRPC**

**¿Por qué?**
- Para un dashboard local, REST es suficiente
- tRPC agrega complejidad innecesaria aquí
- Astro API routes son simples y funcionan bien

**Si escala:**
- Migrar a tRPC para type-safety end-to-end

## Estructura de la Base de Datos

### Entidades

1. **Clients**: Clientes (ACHS, CLME, etc.)
2. **Instances**: Instancias de TrakCare/SMP/INT
3. **Todos**: Tareas
4. **JiraTickets**: Tickets de Jira sincronizados
5. **QuickLinks**: Bookmarks categorizados

### Relaciones

```
clients (1) ──< (N) instances
clients (1) ──< (N) todos
clients (1) ──< (N) jiraTickets
clients (1) ──< (N) quickLinks

instances (1) ──< (N) todos (opcional)
```

## Flujo de Datos

### Página principal (index.astro)

1. **Server-side** (Astro):
   - Query a DB: `clients`, `instances`, `quickLinks`
   - Agrupa datos por cliente
   - Pasa a componente React como props

2. **Client-side** (React Dashboard):
   - Renderiza cards
   - Maneja búsqueda (local, en memoria)
   - CRUD vía API routes

### API Routes

```
POST   /api/clients      → Crear cliente
PUT    /api/clients      → Actualizar cliente
DELETE /api/clients      → Eliminar cliente

POST   /api/instances    → Crear instancia
PUT    /api/instances    → Actualizar instancia
DELETE /api/instances    → Eliminar instancia

GET    /api/todos        → Listar TODOs (con filtros)
POST   /api/todos        → Crear TODO
PUT    /api/todos        → Actualizar TODO
DELETE /api/todos        → Eliminar TODO
```

## Scripts de Seed

### `scripts/seed.ts`

Importa instancias desde `settings.json` de VSCode:

1. Lee `%APPDATA%\Code\User\settings.json`
2. Extrae `intersystems.servers`
3. Normaliza códigos de cliente (ej: `achsbase` → `ACHS`)
4. Detecta ambiente (BASE, UAT, LIVE) y layer (trakcare, integration, smp)
5. Inserta en DB

**Idempotencia:** Usa `onConflictDoUpdate` para evitar duplicados.

### `scripts/import-bookmarks.ts`

Importa bookmarks desde Chrome:

1. Lee `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Bookmarks`
2. Detecta cliente por URL (ej: `10.244.` → ACHS)
3. Detecta categoría (CCR, Jira, Confluence, SharePoint)
4. Inserta en `quickLinks`

### `scripts/sync-jira.ts` (placeholder)

Preparado para sincronizar tickets via MCP de Atlassian:

1. Query Jira con JQL por cliente
2. Inserta/actualiza tickets en DB
3. Marca `syncedAt` timestamp

## Seguridad

### Credenciales

**Actual:**
- Passwords en plaintext en la DB (local, no expuesta)

**Roadmap:**
- Encriptar con `crypto.subtle` (Web Crypto API)
- Opcionalmente usar un Vault (HashiCorp Vault, Bitwarden)

### DB

- Archivo local (`data/trakcontrol.db`)
- **NO commitear** (está en `.gitignore`)
- Para compartir: export/import via script

## Performance

### Optimizaciones actuales

- SSR: HTML pre-renderizado
- Islands: Solo componentes interactivos hidratan
- Búsqueda local: Filtrado en memoria (no re-query)

### Futuras optimizaciones

- Pagination para clientes (>50)
- Virtual scrolling para TODOs
- Lazy load de quick links

## Deployment

### Local (actual)

```bash
pnpm dev      # Dev server (http://localhost:4321)
pnpm build    # Build estático
pnpm preview  # Preview del build
```

### Producción (futuro)

**Opciones:**

1. **Standalone Node server**
   ```bash
   pnpm build
   node dist/server/entry.mjs
   ```

2. **Docker**
   ```dockerfile
   FROM node:22-alpine
   WORKDIR /app
   COPY . .
   RUN pnpm install && pnpm build
   CMD ["node", "dist/server/entry.mjs"]
   ```

3. **Cloudflare Pages** (si migrás a D1 en vez de SQLite)

## Testing (roadmap)

- **Unit tests**: Vitest para utils/helpers
- **Integration tests**: Playwright para flujos end-to-end
- **API tests**: Hono test client para routes

## Monitoring (roadmap)

- **Error tracking**: Sentry
- **Analytics**: Plausible (privacy-first)
- **Uptime**: Health check endpoint `/api/health`

## Backlog Técnico

### High Priority

- [ ] Encriptación de passwords
- [ ] Export/import de DB
- [ ] Health checks de instancias

### Medium Priority

- [ ] Jira sync vía MCP
- [ ] Detección de nodos HA
- [ ] Dark mode toggle manual

### Low Priority

- [ ] Dockerfile
- [ ] Tests
- [ ] Monitoring
