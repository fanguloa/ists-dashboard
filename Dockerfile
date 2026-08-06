# Stage 1: Build & Prepare
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json pnpm-lock.yaml* ./
RUN npm ci

# Copiar código fuente
COPY . .

# Inicializar/migrar la base de datos con las columnas necesarias y cargar el prototipo ACHS
RUN npx tsx scripts/add-ccr-url.ts && \
    npx tsx scripts/add-instance-credentials.ts && \
    npx tsx scripts/add-ha-node-roles.ts && \
    npx tsx scripts/add-node-paths.ts && \
    npx tsx scripts/clean-achs-prototype.ts

# Compilar la aplicación Astro SSR
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Copiar artefactos de compilación y datos
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/scripts ./scripts

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
