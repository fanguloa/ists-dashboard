# TrakControl Dashboard (ists-dashboard)

Dashboard unificado para gestionar accesos, enlaces a CCR, carpetas locales y múltiples credenciales de instancias TrakCare, SMP e Integraciones de InterSystems IRIS.

---

## 🌟 Características Principales

### 1. 📁 Gestión de Proyectos e Instancias
- **Configuración Unificada por Proyecto**:
  - **Link a CCR (Control de Cambios)**: Enlace directo al sistema de CCR/Perforce del proyecto.
  - **Carpeta Local**: Integración con VSCode (`vscode://file/...`), copiar ruta y abrir terminal directamente.
  - **Configuración VPN**: Rango de red IP, host y tipo de VPN (Cisco, GlobalProtect, FortiClient, RDP, OpenVPN).
- **Ambientes y Capas Fijas**:
  - Ambientes por defecto: **`BASE`**, **`UAT`** y **`LIVE`** (con soporte para agregar ambientes personalizados como `DEV`, `TEST`, `SCRATCH`, `PREPROD`, etc.).
  - **Dos capas fijas por ambiente**:
    1. **🌐 Clínica (TrakCare)**: UI de TrakCare + Portal SMP.
    2. **⚡ Integraciones (INT)**: Portal SMP.
  - **Alta Disponibilidad (HA) Parametrizada**:
    - URL de la Gateway VIP.
    - **Nodo 1** y **Nodo 2** con roles parametrizables (**`🟢 Primario`** o **`⚪ Backup`**).
    - Sobrescritura opcional de **Paths por Nodo** (`node1Path` / `node2Path`) cuando la URL del nodo difiere del prefijo del VIP.

### 2. 🔑 Múltiples Credenciales por Link
- Cada capa admite **múltiples credenciales de acceso** de forma independiente.
- Cada credencial define su propio tipo de autenticación:
  - **Basic (User / Pass)**: Usuario y contraseña con etiqueta (ej: `_SYSTEM`, `SuperUser`, `TrakCare Admin`, `Médico Demo`).
  - **SSO**: Integración con Microsoft Azure AD, Okta, SAML u OAuth 2.0.
  - **Sin Auth**: Indicador de acceso público.
- Botones de **copiado rápido** de usuario/clave e **invisibilidad/visibilidad** de contraseñas.
- Indicador badge en las tarjetas con las cuentas registradas (ej. `🔐 _SYSTEM` `🔐 SuperUser` `🔑 SSO`).

### 3. 🌗 Selector de Tema Claro / Oscuro (Dark / Light Mode)
- Toggle dinámico en la cabecera del Dashboard.
- Persistencia automática de preferencia en `localStorage`.
- Detección del tema del sistema operativo y script de carga inmediata sin parpadeo (*zero-FOUC*).

### 4. 📱 Diseño Totalmente Responsive
- Interfaz fluida adaptable a dispositivos móviles, tablets y escritorios.
- Grilla dinámica (`1 col` en celular, `2 cols` en tablet, `3 cols` en monitor).
- Modales adaptados para pantallas pequeñas con barras de desplazamiento y botones de acción pegajosos.

---

## 🚀 Proyecto de Prueba (Prototipo ACHS)

El Dashboard viene precargado con el prototipo de prueba del proyecto **ACHS** (*Asociación Chilena de Seguridad*):

- **CCR Link**: `https://ccr.intersystems.com/ccr/ng/details/system/ACHS/T2026`
- **Carpeta local**: `C:\Proyectos\ACHS`
- **VPN**: GlobalProtect (`vpnprov.achs.cl`)
- **Ambientes**:
  - **`BASE`**: Capas Clínica (`BASE-ACHS`) e Integraciones (`INT`), cargadas con credenciales `_SYSTEM`, `SuperUser` y `Azure AD SSO`.
  - **`UAT` (HA)**: Capas Clínica (`UAT-ACHS`) e Integraciones (`INT`) con **HA habilitado** (VIP `10.244.20.6`, Nodo 1 `10.244.20.4` `🟢 Primario`, Nodo 2 `10.244.20.5` `⚪ Backup`).
  - **`LIVE` (HA)**: Capas Clínica (`LIVE-ACHS`) e Integraciones (`INT`) con **HA habilitado** (VIP `10.244.30.6`, Nodo 1 `10.244.30.4` `🟢 Primario`, Nodo 2 `10.244.30.5` `⚪ Backup`).

---

## 💻 Stack Técnico

- **Astro 7** (SSR con adaptador Node standalone)
- **React 19** (Componentes interactivos de UI)
- **Drizzle ORM** + **SQLite (better-sqlite3 / libsql)** (Base de datos local)
- **Tailwind CSS** (Estilos y soporte `darkMode: 'class'`)
- **Lucide Icons** (Iconografía)
- **Docker & Docker Compose** (Despliegue contenerizado)

---

## 🛠️ Guía de Despliegue

### Opción A: Despliegue con Docker y Docker Compose (Recomendado)

#### 1. Clonar el repositorio
```bash
git clone git@github.com:fanguloa/ists-dashboard.git
cd ists-dashboard
```

#### 2. Iniciar contenedor con Docker Compose
```bash
docker compose up -d --build
```

El contenedor compilará la aplicación y la iniciará en **http://localhost:4321** con los datos del prototipo ACHS y persistencia SQLite en `./data`.

#### 3. Detener o ver logs del contenedor
```bash
# Ver logs
docker compose logs -f

# Detener contenedor
docker compose down
```

---

### Opción B: Desarrollo y Ejecución Local con Node.js

#### 1. Requisitos previos
- Node.js `>= 22.12.0`
- `npm` o `pnpm`

#### 2. Instalar dependencias
```bash
npm install
```

#### 3. Cargar prototipo ACHS en la base de datos local
```bash
npx tsx scripts/clean-achs-prototype.ts
```

#### 4. Iniciar servidor en modo desarrollo
```bash
npm run dev
```

#### 5. Compilar y probar build de producción
```bash
npm run build
npm run preview
```

---

## 📁 Estructura del Proyecto

```
ists-dashboard/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx            # Vista principal responsive
│   │   ├── ClientCard.tsx           # Tarjeta de proyecto con capas y enlaces HA
│   │   ├── EditClientVpnModal.tsx   # Modal amplio con pestañas de Proyecto & Ambientes HA
│   │   ├── EditCredentialsModal.tsx # Modal de gestión de múltiples credenciales por tipo
│   │   ├── ThemeToggle.tsx          # Selector de tema Claro/Oscuro
│   │   └── SearchBar.tsx            # Búsqueda global en tiempo real
│   ├── layouts/
│   │   └── Layout.astro             # Layout principal con script de tema
│   ├── lib/
│   │   ├── db/                      # Inicialización de DB
│   │   └── schema/                  # Esquema Drizzle (clients, instances, etc.)
│   └── pages/
│       ├── index.astro              # Página principal
│       └── api/                     # Endpoints API (clients, instances, environments, credentials/lookup)
├── scripts/
│   ├── add-ccr-url.ts              # Migración ccr_url
│   ├── add-instance-credentials.ts  # Migración credentials JSON
│   ├── add-ha-node-roles.ts        # Migración roles de nodo HA
│   ├── add-node-paths.ts            # Migración paths de nodo HA
│   └── clean-achs-prototype.ts     # Script de carga del prototipo ACHS
├── data/
│   └── trakcontrol.db               # Base de datos SQLite persistente
├── Dockerfile                       # Construcción multi-stage en Docker
├── docker-compose.yml               # Orquestación de contenedor
└── README.md                        # Documentación del proyecto
```

---

## 📄 Licencia

MIT
