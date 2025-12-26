# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache libc6-compat

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias de producción
RUN npm ci --only=production && \
    npm cache clean --force

# ========================================
# Stage 2: Build
# ========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias desde deps
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci

# Copiar código fuente
COPY . .

# Build de producción
ENV NODE_ENV=production
RUN npm run build

# ========================================
# Stage 3: Runtime (Nginx)
# ========================================
FROM nginx:alpine AS runtime

# Instalar curl para health checks
RUN apk add --no-cache curl

# Crear usuario no-root para nginx
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001

# Copiar archivos estáticos desde build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ajustar permisos
RUN chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    chown -R nginx-app:nginx-app /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid

# Cambiar a usuario no-root
USER nginx-app

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Ejecutar nginx
CMD ["nginx", "-g", "daemon off;"]
