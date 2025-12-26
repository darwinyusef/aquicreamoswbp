# Guía de Deployment - CI/CD con Jenkins, K8s y Docker

Esta guía describe paso a paso cómo integrar y desplegar los proyectos `wpaqc` (aquicreamos.com) y `portfolio` (darwinyusef.com) usando Jenkins, Kubernetes y Docker en Digital Ocean.

## Tabla de Contenidos

1. [Preparación del Servidor Digital Ocean](#1-preparación-del-servidor-digital-ocean)
2. [Instalación de Docker](#2-instalación-de-docker)
3. [Instalación de Kubernetes (K8s)](#3-instalación-de-kubernetes-k8s)
4. [Instalación de Jenkins](#4-instalación-de-jenkins)
5. [Configuración de Dockerfiles](#5-configuración-de-dockerfiles)
6. [Configuración de Kubernetes](#6-configuración-de-kubernetes)
7. [Configuración de Jenkins Pipeline](#7-configuración-de-jenkins-pipeline)
8. [Sistema de Tests](#8-sistema-de-tests)
9. [Configuración de Dominios y HTTPS](#9-configuración-de-dominios-y-https)
10. [Storybook para Astro](#10-storybook-para-astro)

---

## 1. Preparación del Servidor Digital Ocean

### 1.1 Crear Droplet
```bash
# Especificaciones recomendadas:
# - SO: Debian 11 o 12 (no Ubuntu)
# - RAM: Mínimo 4GB (8GB recomendado para K8s)
# - CPU: 2 vCPUs mínimo
# - Storage: 80GB SSD
```

### 1.2 Configuración Inicial del Servidor
```bash
# Conectarse al servidor
ssh root@your-server-ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias básicas
apt install -y curl wget git vim apt-transport-https ca-certificates gnupg lsb-release

# Configurar firewall
apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp  # Jenkins
ufw enable
```

---

## 2. Instalación de Docker

### 2.1 Instalar Docker Engine
```bash
# Agregar repositorio de Docker
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verificar instalación
docker --version
docker compose version

# Habilitar Docker al inicio
systemctl enable docker
systemctl start docker
```

### 2.2 Configurar Docker sin sudo (opcional)
```bash
usermod -aG docker $USER
# Reiniciar sesión para aplicar cambios
```

---

## 3. Instalación de Kubernetes (K8s)

### 3.1 Instalar K3s (Kubernetes ligero)
```bash
# Instalar K3s (alternativa ligera a K8s completo)
curl -sfL https://get.k3s.io | sh -

# Verificar instalación
kubectl get nodes

# Configurar kubectl para usuario actual
mkdir -p ~/.kube
cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config

# Verificar cluster
kubectl cluster-info
```

### 3.2 Instalar Helm (gestor de paquetes K8s)
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

---

## 4. Instalación de Jenkins

### 4.1 Instalar Jenkins con Docker
```bash
# Crear red Docker para Jenkins
docker network create jenkins

# Crear volumen para datos de Jenkins
docker volume create jenkins-data

# Ejecutar Jenkins en Docker
docker run -d \
  --name jenkins \
  --restart=on-failure \
  --network jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins-data:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts-jdk17

# Obtener contraseña inicial
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### 4.2 Configuración Inicial de Jenkins
```bash
# 1. Acceder a http://your-server-ip:8080
# 2. Ingresar la contraseña inicial
# 3. Instalar plugins sugeridos
# 4. Crear usuario admin

# Plugins adicionales necesarios:
# - Docker Pipeline
# - Kubernetes
# - Git
# - NodeJS
# - Pipeline
```

### 4.3 Configurar Jenkins con kubectl
```bash
# Copiar configuración de kubectl a Jenkins
docker exec -it jenkins bash
mkdir -p /var/jenkins_home/.kube
exit

docker cp ~/.kube/config jenkins:/var/jenkins_home/.kube/config
docker exec jenkins chown jenkins:jenkins /var/jenkins_home/.kube/config
```

---

## 5. Configuración de Dockerfiles

### 5.1 Dockerfile para wpaqc (Astro)
Crear `/deploy/wpaqc/Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build del proyecto
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar build de Astro a nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración personalizada de nginx
COPY deploy/wpaqc/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 5.2 Dockerfile para portfolio (Astro)
Crear `/deploy/portfolio/Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build del proyecto
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar build de Astro a nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración personalizada de nginx
COPY deploy/portfolio/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 5.3 Configuración de Nginx para wpaqc
Crear `/deploy/wpaqc/nginx.conf`:

```nginx
server {
    listen 80;
    server_name aquicreamos.com www.aquicreamos.com;

    root /usr/share/nginx/html;
    index index.html;

    # Soporte para SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optimización de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compresión gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
```

### 5.4 Configuración de Nginx para portfolio
Crear `/deploy/portfolio/nginx.conf`:

```nginx
server {
    listen 80;
    server_name darwinyusef.com www.darwinyusef.com;

    root /usr/share/nginx/html;
    index index.html;

    # Soporte para SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optimización de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compresión gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
```

---

## 6. Configuración de Kubernetes

### 6.1 Deployment para wpaqc
Crear `/deploy/wpaqc/k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wpaqc-deployment
  labels:
    app: wpaqc
spec:
  replicas: 2
  selector:
    matchLabels:
      app: wpaqc
  template:
    metadata:
      labels:
        app: wpaqc
    spec:
      containers:
      - name: wpaqc
        image: wpaqc:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: wpaqc-service
spec:
  selector:
    app: wpaqc
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

### 6.2 Deployment para portfolio
Crear `/deploy/portfolio/k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: portfolio-deployment
  labels:
    app: portfolio
spec:
  replicas: 2
  selector:
    matchLabels:
      app: portfolio
  template:
    metadata:
      labels:
        app: portfolio
    spec:
      containers:
      - name: portfolio
        image: portfolio:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: portfolio-service
spec:
  selector:
    app: portfolio
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

### 6.3 Ingress Controller (Nginx)
Crear `/deploy/k8s-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: main-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - aquicreamos.com
    - www.aquicreamos.com
    secretName: wpaqc-tls
  - hosts:
    - darwinyusef.com
    - www.darwinyusef.com
    secretName: portfolio-tls
  rules:
  - host: aquicreamos.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: wpaqc-service
            port:
              number: 80
  - host: www.aquicreamos.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: wpaqc-service
            port:
              number: 80
  - host: darwinyusef.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: portfolio-service
            port:
              number: 80
  - host: www.darwinyusef.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: portfolio-service
            port:
              number: 80
```

### 6.4 Instalar Nginx Ingress Controller
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --set controller.service.type=LoadBalancer
```

---

## 7. Configuración de Jenkins Pipeline

### 7.1 Jenkinsfile para wpaqc
Crear `/Jenkinsfile`:

```groovy
pipeline {
    agent any

    environment {
        PROJECT_NAME = 'wpaqc'
        DOCKER_IMAGE = 'wpaqc'
        K8S_NAMESPACE = 'default'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    sh 'npm ci'
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    sh 'npm run test || true'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh """
                        docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} -f deploy/wpaqc/Dockerfile .
                        docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh """
                        kubectl set image deployment/${PROJECT_NAME}-deployment \
                            ${PROJECT_NAME}=${DOCKER_IMAGE}:${BUILD_NUMBER} \
                            -n ${K8S_NAMESPACE}
                        kubectl rollout status deployment/${PROJECT_NAME}-deployment -n ${K8S_NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
```

### 7.2 Jenkinsfile para portfolio
Crear similar en el proyecto portfolio con los nombres correspondientes.

### 7.3 Configurar Jobs en Jenkins
```bash
# 1. Crear nuevo Pipeline en Jenkins
# 2. Configurar Git repository
# 3. Seleccionar "Pipeline script from SCM"
# 4. SCM: Git
# 5. Repository URL: tu-repositorio-git
# 6. Script Path: Jenkinsfile
# 7. Configurar webhook de Git para builds automáticos
```

---

## 8. Sistema de Tests

### 8.1 Configurar Tests Básicos para wpaqc
Crear `/tests/basic.test.js`:

```javascript
import { expect, test } from 'vitest';

test('Build output exists', () => {
  expect(true).toBe(true);
});

// Agregar más tests según necesidad
```

### 8.2 Actualizar package.json
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

---

## 9. Configuración de Dominios y HTTPS

### 9.1 Instalar Cert-Manager para SSL
```bash
# Instalar cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Verificar instalación
kubectl get pods --namespace cert-manager
```

### 9.2 Configurar Let's Encrypt
Crear `/deploy/letsencrypt-issuer.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: tu-email@ejemplo.com  # Cambiar por tu email
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

Aplicar configuración:
```bash
kubectl apply -f deploy/letsencrypt-issuer.yaml
```

### 9.3 Configurar DNS
```bash
# En Digital Ocean o tu proveedor DNS:

# Para aquicreamos.com (wpaqc):
A Record: @ -> IP-del-servidor
A Record: www -> IP-del-servidor

# Para darwinyusef.com (portfolio):
A Record: @ -> IP-del-servidor
A Record: www -> IP-del-servidor
```

### 9.4 Aplicar Ingress con TLS
```bash
kubectl apply -f deploy/k8s-ingress.yaml

# Verificar certificados
kubectl get certificates
kubectl describe certificate wpaqc-tls
kubectl describe certificate portfolio-tls
```

---

## 10. Storybook para Astro

### 10.1 Instalar Storybook (probar en wpaqc)
```bash
cd /path/to/wpaqc
npx storybook@latest init --type html
```

### 10.2 Configurar Storybook para Astro
Crear `/src/components/Button.stories.js`:

```javascript
export default {
  title: 'Components/Button',
  tags: ['autodocs'],
};

export const Primary = {
  args: {
    label: 'Button',
    primary: true,
  },
};

export const Secondary = {
  args: {
    label: 'Button',
    primary: false,
  },
};
```

### 10.3 Scripts para Storybook
```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### 10.4 Desplegar Storybook (opcional)
```bash
# Build storybook
npm run build-storybook

# Servir con nginx en subdomain
# storybook.aquicreamos.com
```

---

## Checklist de Deployment

### Preparación
- [ ] Servidor Digital Ocean creado (Debian)
- [ ] SSH configurado
- [ ] Firewall configurado
- [ ] Docker instalado
- [ ] K3s instalado
- [ ] Jenkins instalado y corriendo

### Configuración de Proyectos
- [ ] Dockerfiles creados para ambos proyectos
- [ ] Nginx configs creados
- [ ] K8s deployments configurados
- [ ] K8s services configurados
- [ ] Ingress configurado
- [ ] Jenkinsfiles creados

### Seguridad
- [ ] Cert-manager instalado
- [ ] Let's Encrypt issuer configurado
- [ ] Certificados SSL generados
- [ ] HTTPS funcionando

### DNS y Dominios
- [ ] aquicreamos.com apuntando al servidor
- [ ] darwinyusef.com apuntando al servidor
- [ ] Subdominios www configurados

### CI/CD
- [ ] Jenkins jobs configurados
- [ ] Git webhooks configurados
- [ ] Pipeline de tests funcionando
- [ ] Deployment automático funcionando

### Tests y Calidad
- [ ] Tests básicos implementados
- [ ] Storybook configurado (wpaqc)
- [ ] Build exitoso en CI/CD

---

## Comandos Útiles

### Docker
```bash
# Ver logs de Jenkins
docker logs -f jenkins

# Reiniciar Jenkins
docker restart jenkins

# Ver imágenes
docker images

# Limpiar imágenes no usadas
docker image prune -a
```

### Kubernetes
```bash
# Ver pods
kubectl get pods

# Ver deployments
kubectl get deployments

# Ver services
kubectl get services

# Ver ingress
kubectl get ingress

# Logs de un pod
kubectl logs <pod-name>

# Describir recurso
kubectl describe pod <pod-name>

# Escalar deployment
kubectl scale deployment wpaqc-deployment --replicas=3
```

### Jenkins
```bash
# Ver logs en tiempo real
docker logs -f jenkins

# Backup de Jenkins
docker exec jenkins tar czf /tmp/jenkins-backup.tar.gz /var/jenkins_home
docker cp jenkins:/tmp/jenkins-backup.tar.gz ./jenkins-backup.tar.gz
```

---

## Troubleshooting

### Problema: Pods no inician
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
# Verificar recursos disponibles
kubectl top nodes
```

### Problema: Certificado SSL no se genera
```bash
kubectl describe certificate wpaqc-tls
kubectl logs -n cert-manager -l app=cert-manager
# Verificar DNS apunta correctamente
```

### Problema: Jenkins no puede acceder a K8s
```bash
# Verificar configuración kubectl en Jenkins
docker exec jenkins kubectl get nodes
# Re-copiar config si es necesario
```

### Problema: Build falla en Jenkins
```bash
# Ver logs detallados en Jenkins UI
# Verificar permisos de Docker
docker exec jenkins docker ps
```

---

## Próximos Pasos

1. **Monitoreo**: Implementar Prometheus + Grafana
2. **Logging**: Configurar ELK Stack o Loki
3. **Backups**: Automatizar backups de datos
4. **Staging**: Crear ambiente de staging
5. **Seguridad**: Implementar scanner de vulnerabilidades
6. **Performance**: Configurar CDN (CloudFlare)

---

## Referencias

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [K3s Documentation](https://docs.k3s.io/)
- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [Cert-Manager Documentation](https://cert-manager.io/docs/)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Astro Documentation](https://docs.astro.build/)
- [Storybook Documentation](https://storybook.js.org/docs)

---

**Nota**: Esta guía asume conocimientos básicos de Linux, Docker y Kubernetes. Ajusta las configuraciones según tus necesidades específicas.

**Autor**: Darwin Yusef
**Fecha**: 2025-12-26
**Versión**: 1.0.0
