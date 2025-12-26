# Configuración de GitHub Webhooks y Secrets para CI/CD

Esta guía explica cómo configurar los webhooks de GitHub para notificar automáticamente a Jenkins sobre cambios en el repositorio y cómo gestionar secrets de forma segura.

## Tabla de Contenidos

1. [Configuración de Webhooks en GitHub](#1-configuración-de-webhooks-en-github)
2. [Configuración de Secrets en GitHub](#2-configuración-de-secrets-en-github)
3. [Configuración de Jenkins para Webhooks](#3-configuración-de-jenkins-para-webhooks)
4. [Pipeline con Secrets](#4-pipeline-con-secrets)
5. [Deployment Automático a Producción](#5-deployment-automático-a-producción)
6. [Estrategias de Branching](#6-estrategias-de-branching)

---

## 1. Configuración de Webhooks en GitHub

### 1.1 Configurar Jenkins para recibir Webhooks

#### Instalar Plugin de GitHub en Jenkins
```bash
# 1. Ir a Jenkins Dashboard
# 2. Manage Jenkins > Manage Plugins
# 3. Available > Buscar "GitHub Integration"
# 4. Instalar y reiniciar Jenkins
```

#### Generar Token de Jenkins
```bash
# 1. Ir a tu usuario en Jenkins (esquina superior derecha)
# 2. Configure > API Token
# 3. Add new Token
# 4. Nombre: "github-webhook"
# 5. Generate
# 6. COPIAR Y GUARDAR el token (no se volverá a mostrar)
```

#### Configurar GitHub Plugin en Jenkins
```bash
# 1. Manage Jenkins > Configure System
# 2. Buscar sección "GitHub"
# 3. Add GitHub Server
# 4. Name: GitHub
# 5. API URL: https://api.github.com (por defecto)
# 6. Credentials > Add > Jenkins
```

### 1.2 Crear Personal Access Token en GitHub

```bash
# 1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
# 2. Generate new token (classic)
# 3. Nombre: jenkins-webhook-wpaqc
# 4. Scopes necesarios:
#    - repo (todos los permisos)
#    - admin:repo_hook (read:repo_hook y write:repo_hook)
# 5. Generate token
# 6. COPIAR Y GUARDAR el token
```

### 1.3 Configurar Webhook en GitHub para wpaqc

```bash
# 1. Ir al repositorio wpaqc en GitHub
# 2. Settings > Webhooks > Add webhook
# 3. Configurar:

Payload URL: http://YOUR_SERVER_IP:8080/github-webhook/
Content type: application/json
Secret: (generar un secret fuerte)
SSL verification: Enable SSL verification (si tienes HTTPS)

# 4. Events to trigger:
#    [x] Just the push event
#    [x] Pull requests (opcional)

# 5. Active: [x]
# 6. Add webhook
```

### 1.4 Configurar Webhook en GitHub para portfolio

```bash
# Repetir los mismos pasos del 1.3 para el repositorio portfolio
# Usar la misma URL de webhook: http://YOUR_SERVER_IP:8080/github-webhook/
```

### 1.5 Script para exponer Jenkins con HTTPS (Producción)

Crear `/deploy/scripts/setup-jenkins-https.sh`:

```bash
#!/bin/bash

# Este script configura nginx como reverse proxy para Jenkins con HTTPS

# Instalar nginx si no está instalado
apt update
apt install -y nginx

# Crear configuración de nginx para Jenkins
cat > /etc/nginx/sites-available/jenkins <<'EOF'
upstream jenkins {
    server 127.0.0.1:8080 fail_timeout=0;
}

server {
    listen 80;
    server_name jenkins.aquicreamos.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name jenkins.aquicreamos.com;

    # Certificados SSL (generados por certbot)
    ssl_certificate /etc/letsencrypt/live/jenkins.aquicreamos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jenkins.aquicreamos.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_set_header        Host $host:$server_port;
        proxy_set_header        X-Real-IP $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header        X-Forwarded-Proto $scheme;
        proxy_redirect          http:// https://;
        proxy_pass              http://jenkins;

        # Required for Jenkins websocket agents
        proxy_http_version 1.1;
        proxy_request_buffering off;
        proxy_buffering off;
    }
}
EOF

# Habilitar sitio
ln -s /etc/nginx/sites-available/jenkins /etc/nginx/sites-enabled/

# Instalar certbot para SSL
apt install -y certbot python3-certbot-nginx

# Generar certificado SSL
certbot --nginx -d jenkins.aquicreamos.com --non-interactive --agree-tos -m tu-email@ejemplo.com

# Reiniciar nginx
systemctl restart nginx

echo "Jenkins ahora está disponible en https://jenkins.aquicreamos.com"
echo "Actualiza el webhook de GitHub a: https://jenkins.aquicreamos.com/github-webhook/"
```

Ejecutar:
```bash
chmod +x deploy/scripts/setup-jenkins-https.sh
sudo ./deploy/scripts/setup-jenkins-https.sh
```

---

## 2. Configuración de Secrets en GitHub

### 2.1 Secrets Necesarios

Para cada repositorio (wpaqc y portfolio), configurar los siguientes secrets:

```bash
# 1. Ir a GitHub > Repositorio > Settings > Secrets and variables > Actions
# 2. New repository secret
```

#### Secrets para wpaqc:
```
DOCKER_REGISTRY_URL=your-registry.com (opcional si usas Docker Hub)
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password
K8S_CONFIG=<contenido del archivo ~/.kube/config en base64>
JENKINS_URL=https://jenkins.aquicreamos.com
JENKINS_TOKEN=<token generado en Jenkins>
WEBHOOK_SECRET=<secret del webhook>
```

#### Secrets para portfolio:
```
# Los mismos que wpaqc
```

### 2.2 Generar K8S_CONFIG en base64

```bash
# En el servidor
cat ~/.kube/config | base64 -w 0

# Copiar la salida y pegarla como valor de K8S_CONFIG en GitHub Secrets
```

### 2.3 Archivo .env.example para desarrollo

Crear `/deploy/.env.example`:

```bash
# Docker Registry
DOCKER_REGISTRY_URL=
DOCKER_USERNAME=
DOCKER_PASSWORD=

# Kubernetes
K8S_CONFIG=

# Jenkins
JENKINS_URL=
JENKINS_TOKEN=

# GitHub
GITHUB_TOKEN=
WEBHOOK_SECRET=

# Dominios
WPAQC_DOMAIN=aquicreamos.com
PORTFOLIO_DOMAIN=darwinyusef.com

# Email para certificados SSL
SSL_EMAIL=tu-email@ejemplo.com

# Environment
NODE_ENV=production
```

---

## 3. Configuración de Jenkins para Webhooks

### 3.1 Configurar Job para Build Automático

```bash
# 1. En Jenkins, abrir el job de wpaqc
# 2. Configure
# 3. Build Triggers:
#    [x] GitHub hook trigger for GITScm polling
# 4. Save
```

### 3.2 Jenkinsfile Mejorado con Secrets

Actualizar `/Jenkinsfile`:

```groovy
pipeline {
    agent any

    environment {
        PROJECT_NAME = 'wpaqc'
        DOCKER_IMAGE = 'wpaqc'
        K8S_NAMESPACE = 'default'
        DOMAIN = 'aquicreamos.com'

        // Secrets desde Jenkins Credentials
        DOCKER_REGISTRY = credentials('docker-registry-url')
        DOCKER_CREDS = credentials('docker-credentials')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.GIT_BRANCH = sh(
                        script: "git rev-parse --abbrev-ref HEAD",
                        returnStdout: true
                    ).trim()
                }
            }
        }

        stage('Environment Info') {
            steps {
                script {
                    echo "Branch: ${env.GIT_BRANCH}"
                    echo "Commit: ${env.GIT_COMMIT_SHORT}"
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Project: ${PROJECT_NAME}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    sh '''
                        npm ci --prefer-offline --no-audit
                    '''
                }
            }
        }

        stage('Lint') {
            steps {
                script {
                    sh 'npm run lint || true'
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

        stage('Build Application') {
            steps {
                script {
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh """
                        docker build \
                            -t ${DOCKER_IMAGE}:${BUILD_NUMBER} \
                            -t ${DOCKER_IMAGE}:${GIT_COMMIT_SHORT} \
                            -t ${DOCKER_IMAGE}:latest \
                            -f deploy/wpaqc/Dockerfile .
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                branch 'master'  // Solo deploy en branch master
            }
            steps {
                script {
                    sh """
                        # Aplicar configuraciones de K8s
                        kubectl apply -f deploy/wpaqc/k8s-deployment.yaml

                        # Actualizar imagen
                        kubectl set image deployment/${PROJECT_NAME}-deployment \
                            ${PROJECT_NAME}=${DOCKER_IMAGE}:${BUILD_NUMBER} \
                            -n ${K8S_NAMESPACE}

                        # Esperar rollout
                        kubectl rollout status deployment/${PROJECT_NAME}-deployment \
                            -n ${K8S_NAMESPACE} \
                            --timeout=5m
                    """
                }
            }
        }

        stage('Verify Deployment') {
            when {
                branch 'master'
            }
            steps {
                script {
                    sh """
                        # Verificar que los pods estén corriendo
                        kubectl get pods -l app=${PROJECT_NAME} -n ${K8S_NAMESPACE}

                        # Health check
                        sleep 10
                        curl -f https://${DOMAIN} || exit 1
                    """
                }
            }
        }
    }

    post {
        success {
            script {
                def message = """
                ✅ Deployment exitoso!
                Proyecto: ${PROJECT_NAME}
                Branch: ${env.GIT_BRANCH}
                Commit: ${env.GIT_COMMIT_SHORT}
                Build: #${BUILD_NUMBER}
                URL: https://${DOMAIN}
                """.stripIndent()

                echo message

                // Opcional: enviar notificación (Slack, Discord, email, etc.)
            }
        }
        failure {
            script {
                def message = """
                ❌ Deployment fallido!
                Proyecto: ${PROJECT_NAME}
                Branch: ${env.GIT_BRANCH}
                Commit: ${env.GIT_COMMIT_SHORT}
                Build: #${BUILD_NUMBER}
                Ver logs: ${BUILD_URL}console
                """.stripIndent()

                echo message

                // Rollback automático
                sh """
                    kubectl rollout undo deployment/${PROJECT_NAME}-deployment \
                        -n ${K8S_NAMESPACE} || true
                """
            }
        }
        always {
            // Limpiar imágenes viejas
            sh '''
                docker image prune -f --filter "until=72h"
            '''
        }
    }
}
```

### 3.3 Configurar Credentials en Jenkins

```bash
# 1. Manage Jenkins > Manage Credentials
# 2. (global) > Add Credentials

# Credential 1: Docker Registry URL
Kind: Secret text
Secret: <URL del registry o dejar vacío para Docker Hub>
ID: docker-registry-url
Description: Docker Registry URL

# Credential 2: Docker Credentials
Kind: Username with password
Username: <tu-docker-username>
Password: <tu-docker-password>
ID: docker-credentials
Description: Docker Hub Credentials

# Credential 3: GitHub Token
Kind: Secret text
Secret: <github-personal-access-token>
ID: github-token
Description: GitHub Personal Access Token

# Credential 4: Webhook Secret
Kind: Secret text
Secret: <webhook-secret>
ID: webhook-secret
Description: GitHub Webhook Secret
```

---

## 4. Pipeline con Secrets

### 4.1 GitHub Actions para CI (Opcional - complementario)

Crear `/.github/workflows/ci.yml`:

```yaml
name: CI Pipeline

on:
  push:
    branches: [ master, develop ]
  pull_request:
    branches: [ master ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run tests
      run: npm run test

    - name: Build
      run: npm run build

    - name: Notify Jenkins
      if: github.ref == 'refs/heads/master'
      run: |
        curl -X POST \
          -u ${{ secrets.JENKINS_TOKEN }} \
          ${{ secrets.JENKINS_URL }}/job/wpaqc/build
```

### 4.2 Variables de Entorno en Jenkins

Crear `/deploy/scripts/jenkins-env-setup.sh`:

```bash
#!/bin/bash

# Script para configurar variables de entorno en Jenkins

JENKINS_URL="http://localhost:8080"
JENKINS_USER="admin"
JENKINS_TOKEN="your-jenkins-token"

# Función para crear credential en Jenkins
create_credential() {
    local id=$1
    local description=$2
    local secret=$3

    curl -X POST "${JENKINS_URL}/credentials/store/system/domain/_/createCredentials" \
        --user "${JENKINS_USER}:${JENKINS_TOKEN}" \
        --data-urlencode 'json={
            "": "0",
            "credentials": {
                "scope": "GLOBAL",
                "id": "'${id}'",
                "secret": "'${secret}'",
                "description": "'${description}'",
                "$class": "org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl"
            }
        }'
}

# Crear credentials (CAMBIAR LOS VALORES)
create_credential "docker-registry-url" "Docker Registry URL" ""
create_credential "webhook-secret" "GitHub Webhook Secret" "your-webhook-secret"

echo "Credentials creadas exitosamente"
```

---

## 5. Deployment Automático a Producción

### 5.1 Flujo de Trabajo Recomendado

```
Developer push → GitHub → Webhook → Jenkins → Tests → Build → Deploy → Production
```

### 5.2 Estrategia de Deployment

#### Blue-Green Deployment

Actualizar `/deploy/wpaqc/k8s-deployment-blue-green.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wpaqc-blue
  labels:
    app: wpaqc
    version: blue
spec:
  replicas: 2
  selector:
    matchLabels:
      app: wpaqc
      version: blue
  template:
    metadata:
      labels:
        app: wpaqc
        version: blue
    spec:
      containers:
      - name: wpaqc
        image: wpaqc:latest
        ports:
        - containerPort: 80
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wpaqc-green
  labels:
    app: wpaqc
    version: green
spec:
  replicas: 0  # Inicialmente sin réplicas
  selector:
    matchLabels:
      app: wpaqc
      version: green
  template:
    metadata:
      labels:
        app: wpaqc
        version: green
    spec:
      containers:
      - name: wpaqc
        image: wpaqc:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: wpaqc-service
spec:
  selector:
    app: wpaqc
    version: blue  # Cambia a green para switch
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
```

#### Script de Switch Blue-Green

Crear `/deploy/scripts/blue-green-switch.sh`:

```bash
#!/bin/bash

NAMESPACE="default"
APP="wpaqc"
CURRENT=$(kubectl get service ${APP}-service -n ${NAMESPACE} -o jsonpath='{.spec.selector.version}')

if [ "$CURRENT" == "blue" ]; then
    NEW="green"
else
    NEW="blue"
fi

echo "Current version: $CURRENT"
echo "Switching to: $NEW"

# Escalar nueva versión
kubectl scale deployment ${APP}-${NEW} --replicas=2 -n ${NAMESPACE}

# Esperar que esté listo
kubectl rollout status deployment/${APP}-${NEW} -n ${NAMESPACE}

# Cambiar service
kubectl patch service ${APP}-service -n ${NAMESPACE} -p '{"spec":{"selector":{"version":"'${NEW}'"}}}'

# Esperar 30 segundos
sleep 30

# Si todo está bien, escalar versión antigua a 0
echo "Scaling down old version..."
kubectl scale deployment ${APP}-${CURRENT} --replicas=0 -n ${NAMESPACE}

echo "Switch completed successfully!"
```

### 5.3 Jenkinsfile con Blue-Green

```groovy
stage('Blue-Green Deployment') {
    when {
        branch 'master'
    }
    steps {
        script {
            sh """
                chmod +x deploy/scripts/blue-green-switch.sh
                ./deploy/scripts/blue-green-switch.sh
            """
        }
    }
}
```

---

## 6. Estrategias de Branching

### 6.1 GitFlow Recomendado

```
master (producción)
  ↑
develop (staging)
  ↑
feature/nombre-feature
hotfix/nombre-hotfix
```

### 6.2 Configurar Diferentes Environments

#### Jenkinsfile Multi-Branch

```groovy
pipeline {
    agent any

    environment {
        PROJECT_NAME = 'wpaqc'
    }

    stages {
        stage('Determine Environment') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'master') {
                        env.DEPLOY_ENV = 'production'
                        env.K8S_NAMESPACE = 'production'
                        env.DOMAIN = 'aquicreamos.com'
                    } else if (env.BRANCH_NAME == 'develop') {
                        env.DEPLOY_ENV = 'staging'
                        env.K8S_NAMESPACE = 'staging'
                        env.DOMAIN = 'staging.aquicreamos.com'
                    } else {
                        env.DEPLOY_ENV = 'none'
                    }

                    echo "Environment: ${env.DEPLOY_ENV}"
                }
            }
        }

        // ... resto de stages

        stage('Deploy') {
            when {
                expression { env.DEPLOY_ENV != 'none' }
            }
            steps {
                script {
                    sh """
                        kubectl apply -f deploy/wpaqc/k8s-deployment.yaml -n ${K8S_NAMESPACE}
                        kubectl set image deployment/${PROJECT_NAME}-deployment \
                            ${PROJECT_NAME}=${PROJECT_NAME}:${BUILD_NUMBER} \
                            -n ${K8S_NAMESPACE}
                    """
                }
            }
        }
    }
}
```

### 6.3 Webhooks para Diferentes Branches

```bash
# En GitHub webhook settings:
# Events:
#   - Push (todas las branches)
#   - Pull Request (para review)

# Jenkins configurará automáticamente multi-branch pipelines
```

---

## 7. Monitoreo de Webhooks

### 7.1 Ver Logs de Webhooks en GitHub

```bash
# 1. GitHub > Repository > Settings > Webhooks
# 2. Click en el webhook configurado
# 3. Recent Deliveries
# 4. Ver cada request/response
```

### 7.2 Debugear Problemas de Webhook

```bash
# Ver logs de Jenkins
docker logs -f jenkins

# Ver logs de nginx (si está como reverse proxy)
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Test manual del webhook
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"ref":"refs/heads/master"}' \
  http://YOUR_SERVER_IP:8080/github-webhook/
```

---

## 8. Checklist de Configuración

### GitHub
- [ ] Personal Access Token generado
- [ ] Webhook configurado en wpaqc
- [ ] Webhook configurado en portfolio
- [ ] Secrets configurados en ambos repos
- [ ] Test de webhook exitoso

### Jenkins
- [ ] GitHub plugin instalado
- [ ] Credentials configuradas
- [ ] Jobs configurados para webhooks
- [ ] Jenkinsfile actualizado
- [ ] HTTPS configurado (producción)
- [ ] Firewall permite webhook

### Kubernetes
- [ ] Namespaces creados (production, staging)
- [ ] Deployments configurados
- [ ] Services configurados
- [ ] Ingress configurado

### Deployment
- [ ] Push a master dispara deployment
- [ ] Tests se ejecutan automáticamente
- [ ] Rollback automático en caso de fallo
- [ ] Notificaciones configuradas

---

## 9. Troubleshooting

### Webhook no dispara build

```bash
# 1. Verificar que el webhook esté activo en GitHub
# 2. Ver Recent Deliveries en GitHub
# 3. Verificar que Jenkins esté accesible desde internet
# 4. Revisar firewall del servidor
sudo ufw status

# 5. Verificar logs de Jenkins
docker logs jenkins | grep webhook
```

### Build falla con secrets

```bash
# 1. Verificar que los credentials existan en Jenkins
# 2. Verificar IDs de credentials en Jenkinsfile
# 3. Ver logs detallados del build
```

### Deployment no refleja cambios

```bash
# 1. Verificar que el build fue exitoso
# 2. Ver pods en K8s
kubectl get pods -n production

# 3. Ver imagen actual
kubectl describe deployment wpaqc-deployment -n production | grep Image

# 4. Forzar pull de imagen
kubectl rollout restart deployment/wpaqc-deployment -n production
```

---

## Recursos Adicionales

- [GitHub Webhooks Documentation](https://docs.github.com/en/webhooks)
- [Jenkins GitHub Plugin](https://plugins.jenkins.io/github/)
- [Managing Secrets in Kubernetes](https://kubernetes.io/docs/concepts/configuration/secret/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Nota**: Mantén todos los secrets seguros y NUNCA los commits al repositorio.

**Última actualización**: 2025-12-26
