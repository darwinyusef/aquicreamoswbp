# Configuración de Puertos - wpaqc y portfolio

Este documento explica la configuración de puertos para evitar conflictos entre los dos proyectos.

## Resumen de Puertos

### Desarrollo Local (Docker Compose)

| Proyecto | Puerto Host | Puerto Container | URL Local |
|----------|-------------|------------------|-----------|
| **wpaqc** | 4000 | 8080 | http://localhost:4000 |
| **portfolio** | 3000 | 8080 | http://localhost:3000 |

### Producción (Kubernetes)

| Proyecto | Service Port | Container Port | Dominio |
|----------|--------------|----------------|---------|
| **wpaqc** | 80 | 8080 | aquicreamos.com |
| **portfolio** | 80 | 8080 | darwinyusef.com, en.darwinyusef.com, br.darwinyusef.com |

---

## Configuración Detallada

### 1. wpaqc (aquicreamos.com)

#### Desarrollo Local
```yaml
# docker-compose.yml
ports:
  - "4000:8080"  # Host:Container
```

**Acceso local**: http://localhost:4000

#### Nginx Container
```nginx
# nginx.conf
listen 8080;  # Puerto interno del container
```

#### Kubernetes
```yaml
# Service
ports:
- port: 80        # Puerto del Service
  targetPort: 8080  # Puerto del Container

# Container
ports:
- containerPort: 8080
```

**Acceso producción**:
- https://aquicreamos.com → Ingress:443 → Service:80 → Pod:8080
- https://www.aquicreamos.com → Ingress:443 → Service:80 → Pod:8080

---

### 2. portfolio (darwinyusef.com)

#### Desarrollo Local
```yaml
# docker-compose.yml
ports:
  - "3000:8080"  # Host:Container
```

**Acceso local**: http://localhost:3000

#### Nginx Container
```nginx
# nginx.conf (multi-idioma)
listen 8080;  # Puerto interno del container
server_name darwinyusef.com www.darwinyusef.com;  # Español
server_name en.darwinyusef.com;  # Inglés
server_name br.darwinyusef.com;  # Portugués
```

#### Kubernetes
```yaml
# Service
ports:
- port: 80        # Puerto del Service
  targetPort: 8080  # Puerto del Container

# Container
ports:
- containerPort: 8080
```

**Acceso producción**:
- https://darwinyusef.com → Ingress:443 → Service:80 → Pod:8080 (Español)
- https://www.darwinyusef.com → Ingress:443 → Service:80 → Pod:8080 (Español)
- https://en.darwinyusef.com → Ingress:443 → Service:80 → Pod:8080 (Inglés)
- https://br.darwinyusef.com → Ingress:443 → Service:80 → Pod:8080 (Portugués)

---

## Flujo de Tráfico

### Desarrollo Local

```
Usuario → localhost:4000 → Docker (wpaqc) → nginx:8080 → Astro App
Usuario → localhost:3000 → Docker (portfolio) → nginx:8080 → Astro App
```

### Producción Kubernetes

```
Usuario → aquicreamos.com:443 (HTTPS)
  ↓
Ingress Controller (nginx) - Termina SSL
  ↓
wpaqc-service:80
  ↓
wpaqc-pod:8080
  ↓
nginx (dentro del pod)
  ↓
Archivos estáticos de Astro
```

```
Usuario → darwinyusef.com:443 (HTTPS)
  ↓
Ingress Controller (nginx) - Termina SSL
  ↓
portfolio-service:80
  ↓
portfolio-pod:8080
  ↓
nginx (dentro del pod) - Routing multi-idioma
  ↓
Archivos estáticos de Astro (es/en/pt)
```

---

## ¿Por qué estos puertos?

### Puerto 8080 en Container
- Puerto común para aplicaciones web
- No requiere privilegios root (puertos < 1024 sí requieren)
- Consistente entre ambos proyectos

### Puertos Host Diferentes (4000 vs 3000)
- **Evita conflictos** cuando ambos proyectos corren simultáneamente en desarrollo
- **3000**: Puerto estándar para desarrollo (React, Next.js, etc.) → portfolio
- **4000**: Puerto alternativo común → wpaqc

### Puerto 80 en Services (K8s)
- Puerto estándar HTTP dentro del cluster
- El Ingress Controller lo mapea desde 443 (HTTPS)

### Puerto 443 en Ingress
- Puerto estándar HTTPS
- Manejado por el Ingress Controller
- Certificados SSL/TLS automáticos con cert-manager

---

## Comandos Útiles

### Desarrollo Local

```bash
# Iniciar wpaqc
cd /Users/yusefgonzalez/proyectos/wpaqc
docker compose up -d
# Acceder: http://localhost:4000

# Iniciar portfolio
cd /Users/yusefgonzalez/proyectos/portfolio/astro-portfolio
docker compose up -d
# Acceder: http://localhost:3000

# Ver logs
docker logs -f wpaqc-web
docker logs -f astro-portfolio

# Detener
docker compose down
```

### Verificar Puertos en Uso

```bash
# macOS
lsof -i :3000
lsof -i :4000
lsof -i :8080

# Linux
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000

# Docker
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### Kubernetes

```bash
# Ver services y sus puertos
kubectl get svc -n production

# Ver pods y sus puertos
kubectl get pods -n production -o wide

# Port-forward para debug
kubectl port-forward -n production svc/wpaqc-service 8080:80
kubectl port-forward -n production svc/portfolio-service 8081:80

# Verificar Ingress
kubectl get ingress -n production
kubectl describe ingress main-ingress -n production
```

---

## Problemas Comunes

### Error: "Port 3000 is already in use"

```bash
# Encontrar proceso usando el puerto
lsof -i :3000

# Detener el proceso
kill -9 <PID>

# O cambiar el puerto en docker-compose.yml
ports:
  - "3001:8080"  # Usar puerto 3001 en su lugar
```

### Error: "Port 4000 is already in use"

```bash
# Similar al anterior
lsof -i :4000
kill -9 <PID>

# O cambiar puerto
ports:
  - "4001:8080"
```

### Container no responde en localhost

```bash
# Verificar que el container está corriendo
docker ps | grep -E "wpaqc|portfolio"

# Verificar logs
docker logs wpaqc-web
docker logs astro-portfolio

# Verificar health check
docker inspect wpaqc-web | grep -A 10 Health
```

### Kubernetes Service no alcanzable

```bash
# Verificar que el pod está corriendo
kubectl get pods -n production

# Verificar service endpoints
kubectl get endpoints -n production

# Test dentro del cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- sh
curl http://wpaqc-service.production.svc.cluster.local
```

---

## Configuración de Firewall

### Digital Ocean / Cloud

```bash
# Permitir tráfico HTTP/HTTPS en firewall
ufw allow 80/tcp
ufw allow 443/tcp

# NO exponer puertos de desarrollo
# 3000 y 4000 solo para localhost
```

### Jenkins (si está separado)

```bash
# Puerto Jenkins UI
ufw allow 8080/tcp

# O mejor con nginx reverse proxy en 443
# Configurar subdomain: jenkins.aquicreamos.com
```

---

## Resumen Visual

```
┌─────────────────────────────────────────────────────────┐
│                    DESARROLLO LOCAL                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  wpaqc          →  localhost:4000  →  container:8080   │
│  portfolio      →  localhost:3000  →  container:8080   │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    PRODUCCIÓN K8S                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  aquicreamos.com:443  →  Ingress  →  Service:80  →  Pod:8080  │
│  darwinyusef.com:443  →  Ingress  →  Service:80  →  Pod:8080  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist de Configuración

### Desarrollo
- [ ] Puerto 4000 libre para wpaqc
- [ ] Puerto 3000 libre para portfolio
- [ ] Docker Compose configurado correctamente
- [ ] Ambos proyectos pueden correr simultáneamente

### Producción
- [ ] Ingress Controller instalado
- [ ] Cert-manager configurado
- [ ] DNS apuntando a IP del servidor
- [ ] Certificados SSL generados
- [ ] Services expuestos en puerto 80
- [ ] Pods escuchando en puerto 8080

---

**Última actualización**: 2025-12-26
