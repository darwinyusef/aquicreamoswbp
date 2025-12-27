# ========================================
# Makefile para WPAQC con Astro + SQLite
# ========================================

.PHONY: help dev prod-static prod-node build-static build-node up-static up-node down logs ps clean health stats shell db-backup db-restore

# Variables
COMPOSE_STATIC = docker-compose.yml
COMPOSE_NODE = docker-compose.node.yml
CONTAINER_STATIC = wpaqc-web
CONTAINER_NODE = wpaqc-node-app

# ========================================
# Ayuda
# ========================================
help: ## Mostrar esta ayuda
	@echo "========================================="
	@echo "  WPAQC - Comandos disponibles"
	@echo "========================================="
	@echo ""
	@echo "Desarrollo:"
	@echo "  make dev              - Iniciar en modo desarrollo (npm run dev)"
	@echo ""
	@echo "Producción - Estático (Nginx):"
	@echo "  make prod-static      - Construir y ejecutar versión estática"
	@echo "  make build-static     - Solo construir versión estática"
	@echo "  make up-static        - Solo ejecutar versión estática"
	@echo ""
	@echo "Producción - Node.js con SSR + SQLite:"
	@echo "  make prod-node        - Construir y ejecutar versión Node (RECOMENDADO para APIs)"
	@echo "  make build-node       - Solo construir versión Node"
	@echo "  make up-node          - Solo ejecutar versión Node"
	@echo ""
	@echo "Control:"
	@echo "  make down             - Detener todos los contenedores"
	@echo "  make logs             - Ver logs (static por defecto)"
	@echo "  make logs-node        - Ver logs de versión Node"
	@echo "  make ps               - Ver estado de contenedores"
	@echo "  make clean            - Limpiar contenedores e imágenes"
	@echo ""
	@echo "Utilidades:"
	@echo "  make health           - Ver health check"
	@echo "  make stats            - Ver estadísticas de recursos"
	@echo "  make shell            - Acceder al shell del contenedor"
	@echo "  make db-backup        - Backup de la base de datos SQLite"
	@echo "  make db-restore       - Restaurar base de datos desde backup"
	@echo "========================================="

# ========================================
# Desarrollo
# ========================================
dev: ## Iniciar en modo desarrollo
	@echo "🚀 Iniciando modo desarrollo..."
	npm run dev

# ========================================
# Producción - Estático (Nginx)
# ========================================
prod-static: build-static up-static ## Construir y ejecutar versión estática

build-static: ## Construir versión estática
	@echo "🏗️  Construyendo versión estática..."
	docker-compose -f $(COMPOSE_STATIC) build

up-static: ## Ejecutar versión estática
	@echo "▶️  Iniciando versión estática en http://localhost:4000"
	docker-compose -f $(COMPOSE_STATIC) up -d
	@echo "✅ Aplicación estática corriendo"
	@make ps

# ========================================
# Producción - Node.js con SSR + SQLite
# ========================================
prod-node: build-node up-node ## Construir y ejecutar versión Node (RECOMENDADO)

build-node: ## Construir versión Node
	@echo "🏗️  Construyendo versión Node con SSR y SQLite..."
	docker-compose -f $(COMPOSE_NODE) build --no-cache

up-node: ## Ejecutar versión Node
	@echo "▶️  Iniciando versión Node en http://localhost:4000"
	docker-compose -f $(COMPOSE_NODE) up -d
	@echo "✅ Aplicación Node corriendo con SQLite"
	@echo "📂 Base de datos: appointments.db (volumen persistente)"
	@make ps

# ========================================
# Control
# ========================================
down: ## Detener todos los contenedores
	@echo "⏹️  Deteniendo contenedores..."
	docker-compose -f $(COMPOSE_STATIC) down 2>/dev/null || true
	docker-compose -f $(COMPOSE_NODE) down 2>/dev/null || true
	@echo "✅ Contenedores detenidos"

logs: ## Ver logs de versión estática
	@echo "📋 Logs de versión estática (Ctrl+C para salir)..."
	docker-compose -f $(COMPOSE_STATIC) logs -f

logs-node: ## Ver logs de versión Node
	@echo "📋 Logs de versión Node (Ctrl+C para salir)..."
	docker-compose -f $(COMPOSE_NODE) logs -f

ps: ## Ver estado de contenedores
	@echo "📊 Estado de contenedores:"
	@docker ps -a | grep wpaqc || echo "No hay contenedores de wpaqc corriendo"

clean: ## Limpiar contenedores e imágenes
	@echo "🧹 Limpiando contenedores e imágenes..."
	docker-compose -f $(COMPOSE_STATIC) down -v --rmi all 2>/dev/null || true
	docker-compose -f $(COMPOSE_NODE) down -v --rmi all 2>/dev/null || true
	docker system prune -f
	@echo "✅ Limpieza completada"

# ========================================
# Utilidades
# ========================================
health: ## Ver health check
	@echo "🏥 Health check:"
	@docker inspect $(CONTAINER_NODE) --format='{{.State.Health.Status}}' 2>/dev/null || \
	docker inspect $(CONTAINER_STATIC) --format='{{.State.Health.Status}}' 2>/dev/null || \
	echo "❌ No hay contenedores corriendo"

stats: ## Ver estadísticas de recursos
	@echo "📈 Estadísticas de recursos:"
	@docker stats --no-stream $(CONTAINER_NODE) 2>/dev/null || \
	docker stats --no-stream $(CONTAINER_STATIC) 2>/dev/null || \
	echo "❌ No hay contenedores corriendo"

shell: ## Acceder al shell del contenedor
	@echo "🐚 Accediendo al shell..."
	@docker exec -it $(CONTAINER_NODE) sh 2>/dev/null || \
	docker exec -it $(CONTAINER_STATIC) sh 2>/dev/null || \
	echo "❌ No hay contenedores corriendo"

# ========================================
# Base de Datos SQLite
# ========================================
db-backup: ## Backup de la base de datos
	@echo "💾 Creando backup de la base de datos..."
	@mkdir -p backups
	@docker cp $(CONTAINER_NODE):/app/appointments.db ./backups/appointments_$(shell date +%Y%m%d_%H%M%S).db 2>/dev/null || \
	cp appointments.db ./backups/appointments_$(shell date +%Y%m%d_%H%M%S).db 2>/dev/null || \
	echo "❌ No se pudo crear el backup"
	@echo "✅ Backup creado en ./backups/"

db-restore: ## Restaurar base de datos desde backup
	@echo "⚠️  Restaurar base de datos"
	@echo "Archivos de backup disponibles:"
	@ls -1 backups/*.db 2>/dev/null || echo "No hay backups disponibles"
	@echo ""
	@read -p "Ingresa el nombre del archivo a restaurar: " backup_file; \
	if [ -f "backups/$$backup_file" ]; then \
		docker cp backups/$$backup_file $(CONTAINER_NODE):/app/appointments.db && \
		echo "✅ Base de datos restaurada"; \
	else \
		echo "❌ Archivo no encontrado"; \
	fi

# ========================================
# Comandos rápidos
# ========================================
quick-node: down prod-node ## Reinicio rápido versión Node
	@echo "🔄 Reinicio rápido completado"

quick-static: down prod-static ## Reinicio rápido versión estática
	@echo "🔄 Reinicio rápido completado"
