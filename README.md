# TrakControl Dashboard

Dashboard unificado para gestionar accesos, enlaces a CCR, carpetas locales y múltiples credenciales de instancias TrakCare, SMP e Integraciones de InterSystems IRIS.

---

## 🌟 Características Principales

### 1. 📁 Gestión de Proyectos e Instancias
- **Configuración por Proyecto**:
  - **Link a CCR (Control de Cambios)**: Enlace directo al sistema de CCR/Perforce del proyecto.
  - **Carpeta Local**: Integración con VSCode (`vscode://file/...`), copiar ruta y abrir terminal directamente.
  - **Configuración VPN**: Rango de red IP, host y tipo de VPN (Cisco, GlobalProtect, FortiClient, RDP, OpenVPN).
- **Ambientes y Capas**:
  - Clasificación por ambiente: `BASE`, `UAT`, `DEV`, `TEST`, `LIVE`, `SCRATCH`.
  - Capas soportadas: **TrakCare** (aplicación clínica), **Integration** (buses de integración) y **SMP** (System Management Portal).
  - Soporte de Alta Disponibilidad (**HA**) con Gateway, Nodo 1 y Nodo 2.

### 2. 🔑 Múltiples Credenciales por Link
- Cada ambiente / capa admite **múltiples credenciales de acceso**.
- Cada credencial especifica su propio tipo de autenticación:
  - **Basic (User / Pass)**: Usuario y contraseña con etiqueta (ej: `_SYSTEM`, `SuperUser`, `TrakCare Admin`, `Médico Demo`).
  - **SSO**: Integración con Microsoft Azure AD, Okta, SAML u OAuth 2.0.
  - **Sin Auth**: Indicador de acceso público.
- Botones de **copiado rápido** de usuario/clave e **invisibilidad/visibilidad** de contraseñas.
- Indicador badge en las tarjetas con el número de cuentas registradas (ej. `🔐 _SYSTEM` `🔐 SuperUser` `🔑 SSO`).

### 3. 🌗 Selector de Tema Claro / Oscuro (Dark / Light Mode)
- Toggle dinámico en la cabecera del Dashboard.
- Persistencia automática de preferencia en `localStorage`.
- Detección de tema del sistema operativo y script de carga sin parpadeos (*zero-FOUC*).

### 4. 🔍 Búsqueda y Herramientas Rápidas
- Barra de búsqueda global en tiempo real por código de proyecto, nombre de cliente, ambiente o namespace.
- **Quick Links & Bookmarks**: Accesos directos organizados.
- **Panel de TODOs**: Tareas pendientes por proyecto e instancia.

---

## 🚀 Proyecto de Prueba (Ejemplo ACHS)

El Dashboard incluye por defecto la configuración de prueba del proyecto **ACHS** (*Asociación Chilena de Seguridad*):

- **CCR Link**: `https://ccr.intersystems.com/ccr/ng/details/system/ACHS/T2026`
- **Carpeta local**: `C:\Proyectos\ACHS`
- **VPN**: GlobalProtect (`vpnprov.achs.cl`)
- **Ambientes**:
  - **BASE**: Capas TrakCare (`BASE-ACHS`) e Integración (`INT`), cargadas con credenciales `_SYSTEM` y `SuperUser`.
  - **UAT**: Capa TrakCare con **HA** (`UAT-ACHS`, Nodo 1 `10.244.30.4`, Nodo 2 `10.244.30.5`).

---

## 💻 Stack Técnico

- **Astro 7** (SSR con adaptador Node)
- **React 19** (Componentes interactivos de UI)
- **Drizzle ORM** + **SQLite (better-sqlite3 / libsql)** (Base de datos local)
- **Tailwind CSS** (Estilos y soporte `darkMode: 'class'`)
- **Lucide Icons** (Iconografía)

---

## 🛠️ Instalación y Uso

### 1. Instalar dependencias
```bash
npm install
# o con pnpm:
pnpm install
```

### 2. Inicializar / resetear datos de ejemplo (ACHS)
```bash
npx tsx scripts/keep-only-achs.ts
```

### 3. Arrancar servidor en desarrollo
```bash
npm run dev
```

Abre en tu navegador: **http://localhost:4321**

### 4. Compilar para producción
```bash
npm run build
npm run preview
```

---

## 📁 Estructura del Proyecto

```
dashboard/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx            # Vista principal
│   │   ├── ClientCard.tsx           # Tarjeta de proyecto con links y badges
│   │   ├── EditClientVpnModal.tsx   # Configuración de CCR, VPN y proyecto
│   │   ├── EditCredentialsModal.tsx # Gestión de múltiples credenciales por tipo
│   │   ├── ThemeToggle.tsx          # Selector de tema Claro/Oscuro
│   │   └── SearchBar.tsx            # Búsqueda global
│   ├── layouts/
│   │   └── Layout.astro             # Layout principal con script de tema
│   ├── lib/
│   │   ├── db/                      # Inicialización de DB
│   │   └── schema/                  # Esquemas Drizzle (clients, instances, etc.)
│   └── pages/
│       ├── index.astro              # Página de inicio
│       └── api/                     # Endpoints API (clients, instances, credentials/lookup)
├── scripts/
│   ├── add-ccr-url.ts              # Migración columna ccr_url
│   ├── add-instance-credentials.ts  # Migración columna credentials JSON
│   └── keep-only-achs.ts           # Script de configuración de pruebas ACHS
└── data/
    └── trakcontrol.db               # Base de datos SQLite
```

---

## 📄 Licencia

MIT
