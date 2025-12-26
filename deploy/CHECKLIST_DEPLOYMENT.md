# ✅ Checklist de Deployment

## Pre-requisitos

### Local (Desarrollo)
- [ ] Node.js 20+ instalado
- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Git configurado
- [ ] Ambos proyectos clonados

### Servidor Digital Ocean
- [ ] Cuenta de Digital Ocean creada
- [ ] Droplet creado (Debian 11/12, 4GB+ RAM, 2+ vCPUs)
- [ ] SSH key agregado
- [ ] IP pública asignada: `_________________`

### Dominios
- [ ] aquicreamos.com registrado
- [ ] darwinyusef.com registrado
- [ ] Acceso al panel DNS

---

## Fase 1: Configuración del Servidor

### 1.1 Acceso Inicial
```bash
ssh root@YOUR_SERVER_IP
```
- [ ] Conexión SSH exitosa
- [ ] Cambiar password root (si es necesario)

### 1.2 Actualización del Sistema
```bash
apt update && apt upgrade -y
```
- [ ] Sistema actualizado
- [ ] Reiniciar si es necesario: `reboot`

### 1.3 Crear Usuario (Opcional pero recomendado)
```bash
adduser deploy
usermod -aG sudo deploy
```
- [ ] Usuario creado
- [ ] Permisos sudo asignados

### 1.4 Configurar Firewall
```bash
apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp
ufw enable
ufw status
```
- [ ] UFW instalado
- [ ] Reglas configuradas
- [ ] Firewall activado

---

## Fase 2: Instalación de Docker

### 2.1 Instalar Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```
- [ ] Docker instalado
- [ ] Verificar: `docker --version`

### 2.2 Configurar Docker
```bash
systemctl enable docker
systemctl start docker
usermod -aG docker $USER
```
- [ ] Docker habilitado en boot
- [ ] Docker corriendo
- [ ] Usuario agregado al grupo docker

---

## Fase 3: Instalación de Kubernetes (K3s)

### 3.1 Instalar K3s
```bash
curl -sfL https://get.k3s.io | sh -
```
- [ ] K3s instalado
- [ ] Verificar: `kubectl get nodes`

### 3.2 Configurar kubectl
```bash
mkdir -p ~/.kube
cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config
```
- [ ] Config copiado
- [ ] Permisos correctos
- [ ] Variable exportada

### 3.3 Instalar Helm
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```
- [ ] Helm instalado
- [ ] Verificar: `helm version`

---

## Fase 4: Instalación de Jenkins

### 4.1 Crear Red y Volumen
```bash
docker network create jenkins
docker volume create jenkins-data
```
- [ ] Red creada
- [ ] Volumen creado

### 4.2 Instalar Jenkins
```bash
docker run -d \
  --name jenkins \
  --restart=on-failure \
  --network jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins-data:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts-jdk17
```
- [ ] Container corriendo
- [ ] Verificar: `docker ps | grep jenkins`

### 4.3 Configuración Inicial Jenkins
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```
- [ ] Password obtenido: `_________________`
- [ ] Acceder a `http://SERVER_IP:8080`
- [ ] Completar setup inicial
- [ ] Instalar plugins sugeridos
- [ ] Crear usuario admin

### 4.4 Configurar kubectl en Jenkins
```bash
docker exec -it jenkins bash -c "mkdir -p /var/jenkins_home/.kube"
docker cp ~/.kube/config jenkins:/var/jenkins_home/.kube/config
docker exec jenkins chown jenkins:jenkins /var/jenkins_home/.kube/config
```
- [ ] Config copiado
- [ ] Permisos correctos
- [ ] Verificar: `docker exec jenkins kubectl get nodes`

---

## Fase 5: Configuración de Kubernetes

### 5.1 Crear Namespaces
```bash
kubectl apply -f - << 'YAML'
apiVersion: v1
kind: Namespace
metadata:
  name: production
---
apiVersion: v1
kind: Namespace
metadata:
  name: staging
YAML
```
- [ ] Namespace production creado
- [ ] Namespace staging creado
- [ ] Verificar: `kubectl get namespaces`

### 5.2 Instalar Nginx Ingress Controller
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --set controller.service.type=LoadBalancer
```
- [ ] Ingress instalado
- [ ] Verificar: `kubectl get pods -n default | grep ingress`
- [ ] Obtener IP externa: `kubectl get svc nginx-ingress-ingress-nginx-controller`

### 5.3 Instalar Cert-Manager
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```
- [ ] Cert-manager instalado
- [ ] Verificar: `kubectl get pods -n cert-manager`

### 5.4 Configurar Let's Encrypt
```bash
kubectl apply -f - << 'YAML'
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: TU_EMAIL@ejemplo.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
YAML
```
- [ ] ClusterIssuer creado
- [ ] Email configurado
- [ ] Verificar: `kubectl get clusterissuer`

---

## Fase 6: Configuración DNS

### 6.1 Obtener IP del Servidor
```bash
curl ifconfig.me
```
- [ ] IP obtenida: `_________________`

### 6.2 Configurar DNS en el Proveedor

**Para aquicreamos.com:**
- [ ] A Record: `@` → `SERVER_IP`
- [ ] A Record: `www` → `SERVER_IP`
- [ ] Verificar: `dig aquicreamos.com`

**Para darwinyusef.com:**
- [ ] A Record: `@` → `SERVER_IP`
- [ ] A Record: `www` → `SERVER_IP`
- [ ] A Record: `en` → `SERVER_IP`
- [ ] A Record: `br` → `SERVER_IP`
- [ ] Verificar: `dig darwinyusef.com`

### 6.3 Esperar Propagación DNS
```bash
watch -n 10 'dig aquicreamos.com +short && dig darwinyusef.com +short'
```
- [ ] DNS propagado (puede tomar 5-30 minutos)

---

## Fase 7: Deploy de Aplicaciones

### 7.1 Clonar Repositorios en Servidor
```bash
cd ~
git clone https://github.com/TU_USUARIO/wpaqc.git
git clone https://github.com/TU_USUARIO/portfolio.git
```
- [ ] wpaqc clonado
- [ ] portfolio clonado

### 7.2 Build de Imágenes Docker

**wpaqc:**
```bash
cd ~/wpaqc
docker build -t wpaqc:latest .
```
- [ ] Imagen wpaqc construida
- [ ] Verificar: `docker images | grep wpaqc`

**portfolio:**
```bash
cd ~/portfolio/astro-portfolio
docker build -t portfolio:latest .
```
- [ ] Imagen portfolio construida
- [ ] Verificar: `docker images | grep portfolio`

### 7.3 Deploy a Kubernetes

**wpaqc:**
```bash
cd ~/wpaqc
kubectl apply -f deploy/wpaqc/k8s-deployment.yaml -n production
```
- [ ] Deployment aplicado
- [ ] Verificar: `kubectl get pods -n production`

**portfolio:**
```bash
cd ~/portfolio/astro-portfolio
kubectl apply -f deploy/portfolio/k8s-deployment.yaml -n production
```
- [ ] Deployment aplicado
- [ ] Verificar: `kubectl get pods -n production`

### 7.4 Aplicar Ingress
```bash
cd ~/wpaqc
kubectl apply -f deploy/k8s-ingress.yaml -n production
```
- [ ] Ingress aplicado
- [ ] Verificar: `kubectl get ingress -n production`

### 7.5 Verificar Certificados SSL
```bash
kubectl get certificates -n production
```
- [ ] wpaqc-tls: Ready
- [ ] portfolio-tls: Ready
- [ ] (Puede tomar 2-5 minutos)

---

## Fase 8: Configuración de GitHub

### 8.1 Crear Personal Access Token
- [ ] Ir a GitHub Settings → Developer settings → Personal access tokens
- [ ] Generate new token (classic)
- [ ] Scopes: `repo`, `admin:repo_hook`
- [ ] Copiar token: `_________________`

### 8.2 Configurar Webhooks

**wpaqc:**
- [ ] Ir a repo → Settings → Webhooks
- [ ] Add webhook
- [ ] Payload URL: `http://SERVER_IP:8080/github-webhook/`
- [ ] Content type: `application/json`
- [ ] Secret: (generar uno fuerte)
- [ ] Events: Push, Pull request
- [ ] Active: ✓

**portfolio:**
- [ ] Repetir proceso anterior
- [ ] Mismo webhook URL

### 8.3 Configurar Secrets en GitHub

**wpaqc y portfolio:**
- [ ] Settings → Secrets and variables → Actions
- [ ] New repository secret
- [ ] Agregar:
  - `JENKINS_URL`: `http://SERVER_IP:8080`
  - `JENKINS_TOKEN`: (generar en Jenkins)

---

## Fase 9: Configuración de Jenkins Jobs

### 9.1 Crear Job para wpaqc
- [ ] New Item → Pipeline
- [ ] Name: `wpaqc`
- [ ] Pipeline → Definition: Pipeline script from SCM
- [ ] SCM: Git
- [ ] Repository URL: `https://github.com/TU_USUARIO/wpaqc.git`
- [ ] Branch: `*/master`
- [ ] Script Path: `Jenkinsfile`
- [ ] Build Triggers → GitHub hook trigger for GITScm polling: ✓
- [ ] Save

### 9.2 Crear Job para portfolio
- [ ] Repetir proceso anterior
- [ ] Name: `portfolio`
- [ ] Repository: portfolio
- [ ] Script Path: `Jenkinsfile`

### 9.3 Test Build Manual
- [ ] Build wpaqc manualmente
- [ ] Verificar logs
- [ ] Build exitoso
- [ ] Build portfolio manualmente
- [ ] Verificar logs
- [ ] Build exitoso

---

## Fase 10: Verificación Final

### 10.1 Verificar Sitios Web

**wpaqc:**
- [ ] https://aquicreamos.com carga correctamente
- [ ] https://www.aquicreamos.com carga correctamente
- [ ] Certificado SSL válido
- [ ] Sin errores en consola

**portfolio:**
- [ ] https://darwinyusef.com carga correctamente
- [ ] https://www.darwinyusef.com carga correctamente
- [ ] https://en.darwinyusef.com carga correctamente
- [ ] https://br.darwinyusef.com carga correctamente
- [ ] Certificado SSL válido
- [ ] Sin errores en consola

### 10.2 Test CI/CD

**wpaqc:**
```bash
# En tu máquina local
cd ~/proyectos/wpaqc
echo "# Test" >> README.md
git add .
git commit -m "test: CI/CD"
git push origin master
```
- [ ] Webhook recibido en Jenkins
- [ ] Build iniciado automáticamente
- [ ] Tests ejecutados
- [ ] Deploy exitoso
- [ ] Cambios visibles en https://aquicreamos.com

**portfolio:**
- [ ] Repetir test anterior
- [ ] Verificar en https://darwinyusef.com

### 10.3 Verificar Logs
```bash
# Kubernetes
kubectl logs -f -l app=wpaqc -n production
kubectl logs -f -l app=portfolio -n production

# Jenkins
docker logs -f jenkins
```
- [ ] No hay errores críticos
- [ ] Pods healthy

### 10.4 Verificar Resources
```bash
kubectl top nodes
kubectl top pods -n production
```
- [ ] CPU usage normal (< 80%)
- [ ] Memory usage normal (< 80%)

---

## Fase 11: Configuración de Monitoreo (Opcional)

### 11.1 Configurar Health Checks
- [ ] Crear script de monitoring
- [ ] Configurar alertas
- [ ] Email notifications

### 11.2 Backups
```bash
# Script de backup Jenkins
0 2 * * * docker exec jenkins tar czf /tmp/jenkins-backup-$(date +\%Y\%m\%d).tar.gz /var/jenkins_home
```
- [ ] Backup script creado
- [ ] Cron job configurado

---

## Troubleshooting Checklist

### Si el sitio no carga:
- [ ] Verificar DNS: `dig aquicreamos.com`
- [ ] Verificar pods: `kubectl get pods -n production`
- [ ] Verificar ingress: `kubectl describe ingress main-ingress -n production`
- [ ] Verificar certificados: `kubectl get certificates -n production`
- [ ] Ver logs: `kubectl logs -f deployment/wpaqc-deployment -n production`

### Si Jenkins no hace build:
- [ ] Verificar webhook en GitHub
- [ ] Ver Recent Deliveries en webhook
- [ ] Verificar logs Jenkins: `docker logs jenkins`
- [ ] Verificar job configuration
- [ ] Test manual build

### Si el deployment falla:
- [ ] Ver logs Jenkins build
- [ ] Verificar kubectl access desde Jenkins
- [ ] Verificar imagen Docker existe
- [ ] Verificar recursos K8s disponibles

---

## 🎉 COMPLETADO

### Timestamp: `_________________`

### URLs Finales:
- wpaqc: https://aquicreamos.com
- portfolio: https://darwinyusef.com
- Jenkins: http://SERVER_IP:8080

### Credenciales (guardar en lugar seguro):
- [ ] Jenkins admin password
- [ ] GitHub tokens
- [ ] SSH keys
- [ ] DNS credentials

### Próximos Pasos:
- [ ] Configurar backups regulares
- [ ] Implementar monitoring (Grafana/Prometheus)
- [ ] Configurar CDN (opcional)
- [ ] Optimización de performance
- [ ] Implementar Storybook

---

**Estado**: 
- [ ] En progreso
- [ ] Completado
- [ ] Producción activa

**Notas adicionales:**
```
(Espacio para notas durante el deployment)




```
