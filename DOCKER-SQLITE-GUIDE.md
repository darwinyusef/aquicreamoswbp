# Guía de Docker con Astro SSR + SQLite

## Descripción

Esta guía explica cómo ejecutar WPAQC con Docker usando **Astro en modo SSR (Server-Side Rendering)** con **SQLite** para las APIs de citas.

## Diferencias entre Versiones

### Versión Estática (Nginx)
- **Archivo**: `docker-compose.yml` + `Dockerfile`
- **Servidor**: Nginx
- **Puerto**: 4000 → 8080 (interno)
- **Limitaciones**: ❌ No soporta APIs dinámicas ni SQLite
- **Uso**: Solo para sitios completamente estáticos

### Versión Node.js con SSR + SQLite ⭐ RECOMENDADA
- **Archivos**: `docker-compose.node.yml` + `Dockerfile.node`
- **Servidor**: Node.js standalone
- **Puerto**: 4000 → 4321 (interno)
- **Características**: ✅ APIs, SQLite, SSR completo
- **Uso**: Para aplicaciones con backend y base de datos

---

## Configuración Inicial

### 1. Instalar Dependencias

```bash
npm install
```

Asegúrate de que tienes instalado:
- `better-sqlite3` - Para SQLite
- `@astrojs/node` - Para SSR con Node.js

### 2. Configuración de Astro

El archivo `astro.config.mjs` debe tener:

```javascript
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
    output: 'server',  // SSR habilitado
    adapter: node({
        mode: 'standalone'
    }),
    // ... resto de configuración
});
```

### 3. Variables de Entorno (Opcional)

Crea un archivo `.env` en la raíz:

```env
# Email (opcional)
EMAILJS_API_KEY=tu_key_aqui
# o
RESEND_API_KEY=tu_key_aqui

# Ruta de la base de datos (opcional, usa default si no se especifica)
DB_PATH=/app/appointments.db
```

---

## Uso con Makefile

### Ver Comandos Disponibles
```bash
make help
```

### Iniciar en Desarrollo
```bash
make dev
```
- Puerto: http://localhost:4321
- Hot reload activado
- SQLite en `./appointments.db`

### Producción con Node.js + SQLite ⭐
```bash
make prod-node
```

Esto ejecuta:
1. Construye la imagen Docker
2. Inicia el contenedor
3. Crea el volumen para SQLite

**Acceder**: http://localhost:4000

### Ver Logs
```bash
make logs-node
```

### Detener
```bash
make down
```

### Limpiar Todo
```bash
make clean
```

---

## Uso Directo con Docker Compose

### Construir y Ejecutar
```bash
docker-compose -f docker-compose.node.yml up --build -d
```

### Ver Logs
```bash
docker-compose -f docker-compose.node.yml logs -f
```

### Detener
```bash
docker-compose -f docker-compose.node.yml down
```

### Detener y Eliminar Volúmenes
```bash
docker-compose -f docker-compose.node.yml down -v
```

---

## Gestión de la Base de Datos

### Ubicación de la BD

**En desarrollo (local)**:
```
./appointments.db
```

**En Docker**:
```
Contenedor: /app/appointments.db
Volumen: wpaqc-appointments-db
```

### Backup de la Base de Datos

#### Usando Makefile:
```bash
make db-backup
```

Esto crea un backup en `./backups/appointments_YYYYMMDD_HHMMSS.db`

#### Manual desde Docker:
```bash
docker cp wpaqc-node-app:/app/appointments.db ./appointments_backup.db
```

### Restaurar Base de Datos

#### Usando Makefile:
```bash
make db-restore
```

Sigue las instrucciones para seleccionar el backup.

#### Manual a Docker:
```bash
docker cp ./appointments_backup.db wpaqc-node-app:/app/appointments.db
docker restart wpaqc-node-app
```

### Ver Datos en la BD

#### Desde el host (si tienes sqlite3):
```bash
sqlite3 appointments.db
sqlite> SELECT * FROM appointments;
sqlite> .quit
```

#### Desde el contenedor:
```bash
docker exec -it wpaqc-node-app sh
# sqlite3 /app/appointments.db
sqlite> SELECT * FROM appointments;
sqlite> .quit
# exit
```

---

## Volúmenes de Docker

### Volumen Nombrado (Persistente)
```yaml
volumes:
  wpaqc-db:
    driver: local
    name: wpaqc-appointments-db
```

**Ventajas**:
- ✅ Persistente entre reinicios
- ✅ Gestionado por Docker
- ✅ Fácil de hacer backup

### Volumen Bind (Desarrollo)
```yaml
volumes:
  - ./appointments.db:/app/appointments.db
```

**Ventajas**:
- ✅ Acceso directo desde host
- ✅ Fácil de editar/ver
- ✅ Ideal para desarrollo

**Configuración Actual**: El `docker-compose.node.yml` usa bind mount para desarrollo.

---

## Troubleshooting

### Error: "Cannot find module 'better-sqlite3'"

**Solución**:
```bash
npm install better-sqlite3
docker-compose -f docker-compose.node.yml build --no-cache
```

### Error: "EACCES: permission denied"

**Causa**: Permisos de archivo de BD

**Solución**:
```bash
chmod 666 appointments.db
```

O en Docker:
```bash
docker exec -it wpaqc-node-app chown astro-app:astro-app /app/appointments.db
```

### El contenedor no inicia

**Ver logs**:
```bash
docker-compose -f docker-compose.node.yml logs
```

**Verificar build**:
```bash
docker-compose -f docker-compose.node.yml build --no-cache
```

### Base de datos corrupta

**Restaurar desde backup**:
```bash
make db-restore
```

**O crear nueva BD** (elimina volumen):
```bash
docker-compose -f docker-compose.node.yml down -v
docker-compose -f docker-compose.node.yml up -d
```

### Puerto 4000 ya en uso

**Cambiar puerto en `docker-compose.node.yml`**:
```yaml
ports:
  - "4001:4321"  # Cambiar 4000 por 4001
```

---

## Health Checks

### Verificar salud del contenedor
```bash
docker inspect wpaqc-node-app --format='{{.State.Health.Status}}'
```

Debe mostrar: `healthy`

### Verificar manualmente
```bash
curl http://localhost:4000/
```

---

## Logs y Monitoreo

### Ver logs en tiempo real
```bash
docker-compose -f docker-compose.node.yml logs -f
```

### Ver solo logs de API
```bash
docker-compose -f docker-compose.node.yml logs -f | grep "API"
```

### Ver estadísticas de recursos
```bash
docker stats wpaqc-node-app
```

O con Makefile:
```bash
make stats
```

---

## Despliegue en Producción

### 1. Preparar Servidor

```bash
# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clonar repositorio
git clone <tu-repo>
cd wpaqc
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
nano .env
```

Configurar:
- API keys de email
- Cualquier otra variable necesaria

### 3. Construir y Ejecutar

```bash
make prod-node
```

O manualmente:
```bash
docker-compose -f docker-compose.node.yml up -d --build
```

### 4. Configurar Nginx Reverse Proxy (Opcional)

```nginx
server {
    listen 80;
    server_name wpaqc.aquicreamos.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. Configurar SSL con Certbot

```bash
sudo certbot --nginx -d wpaqc.aquicreamos.com
```

### 6. Configurar Auto-restart

```bash
docker update --restart=always wpaqc-node-app
```

### 7. Configurar Backups Automáticos

Crear cron job:
```bash
crontab -e
```

Agregar:
```
0 2 * * * cd /path/to/wpaqc && make db-backup
```

---

## Migración de Estático a Node

### 1. Detener versión estática
```bash
docker-compose -f docker-compose.yml down
```

### 2. Actualizar Astro config
Ya está actualizado en `astro.config.mjs`

### 3. Iniciar versión Node
```bash
make prod-node
```

### 4. Verificar APIs
```bash
curl http://localhost:4000/api/get-occupied-slots.json
```

---

## Comandos Rápidos de Referencia

```bash
# Desarrollo
make dev                    # Desarrollo local
npm run dev                 # Alternativa

# Producción Node + SQLite
make prod-node             # Construir y ejecutar
make logs-node             # Ver logs
make down                  # Detener
make clean                 # Limpiar todo

# Base de datos
make db-backup            # Backup
make db-restore           # Restaurar
make shell                # Acceder al contenedor

# Utilidades
make health               # Ver health check
make stats                # Ver recursos
make ps                   # Ver contenedores
```

---

## Estructura de Archivos Docker

```
wpaqc/
├── Dockerfile                  # Versión estática (Nginx)
├── Dockerfile.node             # Versión Node.js + SSR ⭐
├── docker-compose.yml          # Compose estático
├── docker-compose.node.yml     # Compose Node.js ⭐
├── .dockerignore              # Archivos a ignorar
├── Makefile                   # Comandos simplificados
├── appointments.db            # Base de datos SQLite (local)
├── backups/                   # Backups de BD
└── src/
    └── lib/
        └── db.ts              # Configuración SQLite
```

---

## Notas Importantes

1. **Usar versión Node** para aplicaciones con APIs
2. **La BD es persistente** gracias al volumen de Docker
3. **Hacer backups regulares** de la base de datos
4. **Monitorear logs** para detectar problemas
5. **Configurar email opcional** para notificaciones

---

## Soporte

Para problemas o preguntas:
1. Revisar logs: `make logs-node`
2. Verificar health: `make health`
3. Ver documentación: `APPOINTMENTS-README.md`

---

**Versión**: 1.0.0
**Última actualización**: Diciembre 2024
**Estado**: ✅ Listo para Producción
