# Guía de Deployment - Aquicreamos WBP

## 📋 Resumen

Este proyecto usa un workflow unificado de CI/CD que se ejecuta automáticamente en cada push a `master`. El workflow construye la aplicación, crea una imagen Docker y la despliega en el servidor de producción.

## 🔐 GitHub Secrets Requeridos

Debes configurar estos secrets en GitHub (Settings → Secrets and variables → Actions → New repository secret):

### Secrets de Conexión SSH
```
SERVER_HOST     # Dirección del servidor (ej: example.com o IP)
SERVER_USER     # Usuario SSH (ej: root, deploy, etc.)
SSH_KEY         # Llave privada SSH (contenido completo del archivo .pem o .key)
SSH_PORT        # Puerto SSH (opcional, default: 22)
```

### Secrets de Aplicación
```
BACKEND_URL     # URL del backend (ej: http://localhost:3001 o https://api.ejemplo.com)
                # El backend maneja: emails, calendario, OpenAI, clasificación ML
                # Esta variable se expone al cliente como PUBLIC_BACKEND_URL
```

## 🚀 Cómo Funciona el Workflow

### Trigger
- Push a rama `master`
- Ejecución manual desde GitHub Actions

### Pasos del Workflow

1. **Checkout & Setup**
   - Clona el código
   - Configura Node.js 20

2. **Build**
   - Instala dependencias con `npm ci`
   - Construye la aplicación con `npm run build`
   - Usa las variables de entorno de GitHub Secrets

3. **Deploy**
   - Se conecta al servidor por SSH
   - Hace `git pull` del código actualizado
   - Crea el archivo `.env` con los secrets
   - Construye la imagen Docker con tags:
     - `aquicreamos:latest`
     - `aquicreamos:{run_number}`
     - `aquicreamos:{commit_hash}`
   - Reinicia el servicio con docker compose
   - Recarga Caddy
   - Limpia imágenes antiguas

4. **Health Check**
   - Verifica que https://aquicreamos.com responda con HTTP 200

5. **Summary**
   - Genera un resumen del deployment

## 📁 Estructura del Proyecto en Servidor

```
/opt/aquicreamoswbp/          # Código del proyecto
├── .env                       # Generado automáticamente por el workflow
├── dist/                      # Build de Astro
├── Dockerfile                 # Configuración de Docker
└── ...

/opt/darwinyusef.portfolio/docker/services/
└── aquicreamos.yml           # Docker Compose para el servicio
```

## 🔄 Variables de Entorno

El archivo `.env` es generado automáticamente en el servidor durante el deployment con:

```env
PUBLIC_BACKEND_URL=<valor desde GitHub Secret>
```

**Nota:** Se usa `PUBLIC_` para que Astro exponga la variable al cliente (navegador).

### Uso en la Aplicación

- **PUBLIC_BACKEND_URL**: Usado por todos los componentes del frontend
  - El frontend llama **directamente** al backend, sin proxies intermedios
  - Endpoints usados (ver `BACKEND_API_SPEC.md` para detalles):
    - `POST /api/chat` - Chat assistant (OpenAI)
    - `POST /api/bug-reports` - Reportes de bugs
    - `POST /api/appointments` - Crear citas
    - `GET /api/appointments/occupied-slots` - Consultar horarios ocupados
    - `POST /api/classify-service` - Clasificación de servicios
  - Fallback: `http://localhost:3001`
  - **Importante**: Toda la lógica de negocio, base de datos y APIs externas se manejan en el backend

## 🐳 Docker

### Dockerfile
- Imagen base: `node:20-alpine`
- Multi-stage build para optimizar tamaño
- Copia el `.env` al contenedor para runtime
- Health check en puerto 4321
- **No incluye base de datos**: Todo el almacenamiento lo maneja el backend

### .dockerignore
- El archivo `.env` NO se ignora (necesario para runtime)
- Se ignoran: node_modules, dist, logs, .git, etc.
- No se incluyen archivos de base de datos (el backend maneja todo el almacenamiento)

## ✅ Verificación Post-Deployment

1. El workflow verifica automáticamente que el sitio responda
2. Puedes verificar manualmente:
   ```bash
   curl https://aquicreamos.com
   docker ps | grep aquicreamos
   docker logs <container_id>
   ```

## 🛠️ Comandos Útiles

### Ver logs del contenedor
```bash
ssh user@server
docker logs -f aquicreamos
```

### Verificar variables de entorno en el contenedor
```bash
docker exec aquicreamos env | grep -E "BACKEND_URL|OPENAI"
```

### Rebuild manual
```bash
cd /opt/aquicreamoswbp
docker build -t aquicreamos:latest .
cd /opt/darwinyusef.portfolio/docker
docker compose -f services/aquicreamos.yml up -d --force-recreate
```

## 🔒 Seguridad

- ❌ Nunca commits el archivo `.env` a git (está en .gitignore)
- ✅ Usa GitHub Secrets para todas las credenciales
- ✅ El `.env` se crea en el servidor durante el deployment
- ✅ Las keys se pasan de forma segura vía SSH
- ✅ El Dockerfile copia el `.env` solo en la imagen final

## 📝 Notas

- El workflow solo se ejecuta en rama `master`
- **Este proyecto NO tiene base de datos local** - Todo el almacenamiento se maneja en el backend
- Los logs del workflow están disponibles en GitHub Actions
- El deployment completo toma aproximadamente 5-10 minutos

## 🏗️ Arquitectura

Este proyecto es un **frontend stateless** que delega toda la lógica de negocio al backend:

```
Frontend (Astro Components)
    │
    │ Llamadas directas HTTP
    │ (sin proxies intermedios)
    ↓
Backend (darwinyusef.portfolio)
    ├─ POST /api/chat               → OpenAI API
    ├─ POST /api/appointments        → PostgreSQL + Google Calendar
    ├─ GET  /api/appointments/...    → PostgreSQL
    ├─ POST /api/bug-reports         → Email + Storage
    └─ POST /api/classify-service    → TensorFlow Model
```

**Ventajas:**
- Frontend ligero y rápido
- Sin capa intermedia de proxies (menor latencia)
- Backend centralizado maneja toda la lógica
- Más fácil de escalar y mantener
- Secrets (API keys, DB) solo en el backend
- Configuración centralizada en `src/config/backend.ts`

## 🐛 Troubleshooting

### El chatbot no funciona
- Verifica que `BACKEND_URL` apunte al servidor correcto
- Verifica que el backend tenga configurada la `OPENAI_API_KEY`
- Verifica que el endpoint `/api/chat` del backend esté funcionando
- Revisa los logs: `docker logs aquicreamos | grep -i backend`

### Las citas no se envían por email
- Verifica que `BACKEND_URL` apunte al servidor correcto
- Verifica que el backend esté funcionando y tenga acceso a Google Calendar API

### Error de conexión SSH
- Verifica `SERVER_HOST`, `SERVER_USER`, `SSH_KEY`
- Asegúrate de que la llave SSH no tenga passphrase
- Verifica que el usuario tenga permisos en `/opt/aquicreamoswbp`

### Health check falla
- Verifica que Caddy esté configurado correctamente
- Verifica que el contenedor esté corriendo: `docker ps`
- Revisa logs: `docker logs aquicreamos`
