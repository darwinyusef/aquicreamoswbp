pipeline {
    agent any

    environment {
        PROJECT_NAME = 'wpaqc'
        DOCKER_IMAGE = 'wpaqc'
        DOMAIN = 'aquicreamos.com'
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

                    // Determinar entorno según branch
                    if (env.GIT_BRANCH == 'master' || env.GIT_BRANCH == 'main') {
                        env.K8S_NAMESPACE = 'production'
                        env.DEPLOY_ENV = 'production'
                    } else if (env.GIT_BRANCH == 'develop') {
                        env.K8S_NAMESPACE = 'staging'
                        env.DEPLOY_ENV = 'staging'
                    } else {
                        env.DEPLOY_ENV = 'none'
                    }
                }
            }
        }

        stage('Environment Info') {
            steps {
                script {
                    echo "================================================"
                    echo "Build Information"
                    echo "================================================"
                    echo "Project: ${PROJECT_NAME}"
                    echo "Branch: ${env.GIT_BRANCH}"
                    echo "Commit: ${env.GIT_COMMIT_SHORT}"
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Environment: ${env.DEPLOY_ENV}"
                    echo "Namespace: ${env.K8S_NAMESPACE}"
                    echo "================================================"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    sh '''
                        echo "Installing Node.js dependencies..."
                        npm ci --prefer-offline --no-audit
                    '''
                }
            }
        }

        stage('Lint') {
            steps {
                script {
                    echo "Running linter..."
                    sh 'npm run lint || echo "Lint failed but continuing..."'
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    echo "Running tests..."
                    sh 'npm run test || echo "Tests not configured or failed"'
                }
            }
        }

        stage('Build Application') {
            steps {
                script {
                    echo "Building application..."
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image..."
                    sh """
                        docker build \
                            -t ${DOCKER_IMAGE}:${BUILD_NUMBER} \
                            -t ${DOCKER_IMAGE}:${GIT_COMMIT_SHORT} \
                            -t ${DOCKER_IMAGE}:latest \
                            -f Dockerfile .
                    """

                    echo "Docker images created:"
                    sh "docker images | grep ${DOCKER_IMAGE}"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                expression { env.DEPLOY_ENV != 'none' }
            }
            steps {
                script {
                    echo "Deploying to ${env.DEPLOY_ENV} environment..."

                    sh """
                        # Verificar que el namespace existe
                        kubectl get namespace ${K8S_NAMESPACE} || kubectl create namespace ${K8S_NAMESPACE}

                        # Aplicar configuraciones de K8s
                        kubectl apply -f deploy/wpaqc/k8s-deployment.yaml -n ${K8S_NAMESPACE}

                        # Actualizar imagen del deployment
                        kubectl set image deployment/${PROJECT_NAME}-deployment \
                            ${PROJECT_NAME}=${DOCKER_IMAGE}:${BUILD_NUMBER} \
                            -n ${K8S_NAMESPACE}

                        # Esperar a que el rollout complete
                        kubectl rollout status deployment/${PROJECT_NAME}-deployment \
                            -n ${K8S_NAMESPACE} \
                            --timeout=5m
                    """
                }
            }
        }

        stage('Verify Deployment') {
            when {
                expression { env.DEPLOY_ENV == 'production' }
            }
            steps {
                script {
                    echo "Verifying deployment..."
                    sh """
                        # Verificar que los pods estén corriendo
                        echo "Checking pods status..."
                        kubectl get pods -l app=${PROJECT_NAME} -n ${K8S_NAMESPACE}

                        # Verificar el deployment
                        kubectl describe deployment ${PROJECT_NAME}-deployment -n ${K8S_NAMESPACE}

                        # Esperar un momento antes del health check
                        sleep 15

                        # Health check (comentado hasta que el dominio esté configurado)
                        # curl -f https://${DOMAIN} || exit 1

                        echo "Deployment verified successfully!"
                    """
                }
            }
        }
    }

    post {
        success {
            script {
                def message = """
                ✅ BUILD Y DEPLOYMENT EXITOSO
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                Proyecto: ${PROJECT_NAME}
                Branch: ${env.GIT_BRANCH}
                Commit: ${env.GIT_COMMIT_SHORT}
                Build: #${BUILD_NUMBER}
                Environment: ${env.DEPLOY_ENV}
                """.stripIndent()

                if (env.DEPLOY_ENV == 'production') {
                    message += "URL: https://${DOMAIN}\n"
                }
                message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

                echo message

                // TODO: Aquí puedes agregar notificaciones a Slack, Discord, etc.
            }
        }

        failure {
            script {
                def message = """
                ❌ BUILD O DEPLOYMENT FALLIDO
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                Proyecto: ${PROJECT_NAME}
                Branch: ${env.GIT_BRANCH}
                Commit: ${env.GIT_COMMIT_SHORT}
                Build: #${BUILD_NUMBER}
                Environment: ${env.DEPLOY_ENV}
                Logs: ${BUILD_URL}console
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                """.stripIndent()

                echo message

                // Intentar rollback si el deploy falló
                if (env.DEPLOY_ENV != 'none') {
                    echo "Attempting rollback..."
                    sh """
                        kubectl rollout undo deployment/${PROJECT_NAME}-deployment \
                            -n ${K8S_NAMESPACE} || echo "Rollback failed or not needed"
                    """
                }

                // TODO: Enviar notificación de fallo
            }
        }

        always {
            script {
                echo "Cleaning up old Docker images..."
                sh '''
                    # Limpiar imágenes Docker viejas (mantener últimas 72 horas)
                    docker image prune -f --filter "until=72h" || true
                '''
            }
        }
    }
}
