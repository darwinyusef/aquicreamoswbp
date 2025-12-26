# Deploy Configuration - wpaqc & portfolio

Configuración completa de CI/CD con Jenkins, Kubernetes y Docker para los proyectos wpaqc y portfolio.

## 📁 Estructura de Archivos

```
wpaqc/
├── Dockerfile                          # Docker multi-stage para producción
├── Dockerfile.dev                      # Docker para desarrollo
├── docker-compose.yml                  # Compose local (puerto 4000)
├── nginx.conf                          # Configuración nginx
├── Jenkinsfile                         # Pipeline CI/CD
└── deploy/
    ├── README.md                       # Este archivo
    ├── GUIA_DEPLOYMENT.md             # Guía completa de deployment
    ├── GITHUB_WEBHOOK_CONFIG.md       # Configuración webhooks y secrets
    ├── CONFIGURACION_PUERTOS.md       # Documentación de puertos
    ├── k8s-ingress.yaml               # Ingress compartido (ambos proyectos)
    ├── wpaqc/
    │   ├── k8s-deployment.yaml        # Deployment y Service K8s
    │   └── k8s-namespace.yaml         # Namespaces (production/staging)
    └── scripts/
        └── (scripts de automatización)

portfolio/astro-portfolio/
├── Dockerfile                          # Docker multi-stage para producción
├── Dockerfile.dev                      # Docker para desarrollo
├── docker-compose.yml                  # Compose local (puerto 3000)
├── nginx.conf                          # Configuración nginx multi-idioma
├── Jenkinsfile                         # Pipeline CI/CD
└── deploy/
    └── portfolio/
        ├── k8s-deployment.yaml        # Deployment y Service K8s
        └── k8s-namespace.yaml         # Namespaces (production/staging)
```

## 🚀 Quick Start

### Desarrollo Local

#### wpaqc
```bash
cd /Users/yusefgonzalez/proyectos/wpaqc

# Usando Docker Compose
docker compose up -d

# Acceder
open http://localhost:4000
```

#### portfolio
```bash
cd /Users/yusefgonzalez/proyectos/portfolio/astro-portfolio

# Usando Docker Compose
docker compose up -d

# Acceder
open http://localhost:3000
```

### Producción (Kubernetes)

```bash
# 1. Aplicar namespaces
kubectl apply -f deploy/wpaqc/k8s-namespace.yaml

# 2. Aplicar deployments
kubectl apply -f deploy/wpaqc/k8s-deployment.yaml
kubectl apply -f deploy/portfolio/k8s-deployment.yaml

# 3. Aplicar ingress (requiere cert-manager)
kubectl apply -f deploy/k8s-ingress.yaml

# 4. Verificar
kubectl get pods -n production
kubectl get svc -n production
kubectl get ingress -n production
```

## 🔧 Configuración de Puertos

### Desarrollo Local
| Proyecto | Host | Container | URL |
|----------|------|-----------|-----|
| wpaqc | 4000 | 8080 | http://localhost:4000 |
| portfolio | 3000 | 8080 | http://localhost:3000 |

### Producción
| Proyecto | Dominio | Container |
|----------|---------|-----------|
| wpaqc | aquicreamos.com | 8080 |
| portfolio | darwinyusef.com | 8080 |
| portfolio | en.darwinyusef.com | 8080 |
| portfolio | br.darwinyusef.com | 8080 |

**Ver detalles completos**: [CONFIGURACION_PUERTOS.md](./CONFIGURACION_PUERTOS.md)

## 📋 Guías Disponibles

### 1. [GUIA_DEPLOYMENT.md](./GUIA_DEPLOYMENT.md)
Guía paso a paso completa que incluye:
- ✅ Configuración del servidor Digital Ocean (Debian)
- ✅ Instalación de Docker
- ✅ Instalación de Kubernetes (K3s)
- ✅ Instalación de Jenkins con Docker
- ✅ Configuración de Dockerfiles
- ✅ Configuración de Kubernetes deployments
- ✅ Configuración de dominios y HTTPS
- ✅ Sistema de tests básicos
- ✅ Storybook para Astro
- ✅ Troubleshooting

### 2. [GITHUB_WEBHOOK_CONFIG.md](./GITHUB_WEBHOOK_CONFIG.md)
Configuración de CI/CD automático:
- ✅ Webhooks de GitHub a Jenkins
- ✅ Gestión de secrets (GitHub + Jenkins)
- ✅ Pipeline automatizado con tests
- ✅ Deploy automático a producción (solo branch master)
- ✅ Rollback automático en caso de fallo
- ✅ Estrategia Blue-Green deployment
- ✅ Multi-branch pipeline (master/develop)

### 3. [CONFIGURACION_PUERTOS.md](./CONFIGURACION_PUERTOS.md)
Documentación detallada de puertos:
- ✅ Configuración de puertos por proyecto
- ✅ Flujo de tráfico desarrollo y producción
- ✅ Comandos útiles de debugging
- ✅ Resolución de conflictos de puertos
- ✅ Configuración de firewall

## 🏗️ Arquitectura

### Flujo de CI/CD

```
Developer Push
    ↓
GitHub Repository
    ↓ (webhook)
Jenkins Pipeline
    ↓
1. Checkout
2. Install Dependencies
3. Lint
4. Tests
5. Build Astro
6. Build Docker Image
7. Deploy to K8s
8. Verify Deployment
    ↓
Production (K8s)
```

### Arquitectura de Producción

```
Internet (HTTPS)
    ↓
Ingress Controller (nginx)
├── aquicreamos.com → wpaqc-service:80 → wpaqc-pod:8080
└── darwinyusef.com → portfolio-service:80 → portfolio-pod:8080
    ├── en.darwinyusef.com
    └── br.darwinyusef.com
```

## 🔐 Seguridad

### Certificados SSL
- ✅ Let's Encrypt con cert-manager
- ✅ Renovación automática
- ✅ HTTPS forzado en todos los dominios

### Secrets Management
- ✅ GitHub Secrets para CI/CD
- ✅ Jenkins Credentials para deployment
- ✅ Kubernetes Secrets para configuración sensible

### Security Headers
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ X-XSS-Protection
- ✅ Referrer-Policy

## 📊 Monitoreo y Logs

### Health Checks
```bash
# Docker
docker ps --format "table {{.Names}}\t{{.Status}}"

# Kubernetes
kubectl get pods -n production
kubectl top pods -n production
```

### Ver Logs
```bash
# Docker
docker logs -f wpaqc-web
docker logs -f astro-portfolio

# Kubernetes
kubectl logs -f deployment/wpaqc-deployment -n production
kubectl logs -f deployment/portfolio-deployment -n production
```

## 🛠️ Comandos Útiles

### Docker

```bash
# Build manual
docker build -t wpaqc:latest .

# Ver imágenes
docker images | grep -E "wpaqc|portfolio"

# Limpiar
docker system prune -a
```

### Kubernetes

```bash
# Ver recursos
kubectl get all -n production

# Describir deployment
kubectl describe deployment wpaqc-deployment -n production

# Escalar
kubectl scale deployment wpaqc-deployment --replicas=3 -n production

# Rollback
kubectl rollout undo deployment/wpaqc-deployment -n production

# Port-forward para debug
kubectl port-forward -n production svc/wpaqc-service 8080:80
```

### Jenkins

```bash
# Ver logs
docker logs -f jenkins

# Backup
docker exec jenkins tar czf /tmp/jenkins-backup.tar.gz /var/jenkins_home
docker cp jenkins:/tmp/jenkins-backup.tar.gz ./jenkins-backup-$(date +%Y%m%d).tar.gz

# Restart
docker restart jenkins
```

## 🎯 Workflow de Desarrollo

### Feature Development

```bash
# 1. Crear branch
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar y probar localmente
docker compose up -d
# Hacer cambios...
open http://localhost:4000  # o 3000 para portfolio

# 3. Commit
git add .
git commit -m "feat: nueva funcionalidad"

# 4. Push (NO despliega automáticamente)
git push origin feature/nueva-funcionalidad

# 5. Pull Request
gh pr create --title "Nueva funcionalidad" --body "Descripción..."

# 6. Merge a develop (despliega a staging)
# Jenkins automáticamente despliega a namespace staging

# 7. Merge a master (despliega a producción)
# Jenkins automáticamente despliega a namespace production
```

### Hotfix en Producción

```bash
# 1. Crear hotfix desde master
git checkout master
git checkout -b hotfix/correccion-critica

# 2. Hacer corrección
# ...

# 3. Commit y push
git add .
git commit -m "fix: corrección crítica"
git push origin hotfix/correccion-critica

# 4. PR directo a master
gh pr create --base master --title "Hotfix: corrección crítica"

# 5. Merge (despliega automáticamente a producción)
```

## 📝 Checklist de Deployment Inicial

### Servidor
- [ ] Droplet Digital Ocean creado (Debian, 4GB+ RAM)
- [ ] SSH configurado
- [ ] Firewall configurado (80, 443, 8080)
- [ ] Docker instalado
- [ ] K3s instalado
- [ ] Jenkins instalado y corriendo

### DNS
- [ ] aquicreamos.com → IP del servidor
- [ ] www.aquicreamos.com → IP del servidor
- [ ] darwinyusef.com → IP del servidor
- [ ] www.darwinyusef.com → IP del servidor
- [ ] en.darwinyusef.com → IP del servidor
- [ ] br.darwinyusef.com → IP del servidor

### Kubernetes
- [ ] Namespaces creados (production, staging)
- [ ] Ingress Controller instalado
- [ ] Cert-manager instalado
- [ ] Let's Encrypt ClusterIssuer configurado
- [ ] Deployments aplicados
- [ ] Services creados
- [ ] Ingress configurado
- [ ] Certificados SSL generados

### Jenkins
- [ ] GitHub plugin instalado
- [ ] Credentials configurados
- [ ] Jobs creados para wpaqc y portfolio
- [ ] Webhook configurado en GitHub
- [ ] First build exitoso

### GitHub
- [ ] Personal Access Token creado
- [ ] Webhooks configurados en ambos repos
- [ ] Secrets configurados
- [ ] Branch protection rules (opcional)

## 🐛 Troubleshooting

### Build falla en Jenkins
```bash
# Ver logs detallados en Jenkins UI
# Verificar que Node.js está disponible
docker exec jenkins node --version

# Verificar permisos de Docker
docker exec jenkins docker ps
```

### Pod no inicia en K8s
```bash
# Ver eventos
kubectl describe pod <pod-name> -n production

# Ver logs
kubectl logs <pod-name> -n production

# Verificar imagen
kubectl get pod <pod-name> -n production -o jsonpath='{.spec.containers[0].image}'
```

### Certificado SSL no se genera
```bash
# Ver certificados
kubectl get certificates -n production

# Ver challenges
kubectl get challenges -n production

# Logs de cert-manager
kubectl logs -n cert-manager -l app=cert-manager

# Verificar DNS
dig aquicreamos.com
dig darwinyusef.com
```

### Sitio no accesible
```bash
# Verificar Ingress
kubectl get ingress -n production
kubectl describe ingress main-ingress -n production

# Verificar Service
kubectl get svc -n production

# Verificar Pods
kubectl get pods -n production

# Test desde dentro del cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- sh
curl http://wpaqc-service.production.svc.cluster.local
```

## 📚 Referencias

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [K3s Documentation](https://docs.k3s.io/)
- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [Cert-Manager Documentation](https://cert-manager.io/docs/)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Astro Documentation](https://docs.astro.build/)

## 🤝 Soporte

Para problemas o preguntas:
1. Revisar sección de Troubleshooting
2. Revisar logs de Jenkins/K8s
3. Consultar las guías detalladas en `/deploy`

---

**Última actualización**: 2025-12-26
**Versión**: 1.0.0
**Autor**: Darwin Yusef
