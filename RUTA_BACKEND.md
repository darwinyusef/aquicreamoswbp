## Backend
- **Local físico:** G:\darwinyusef.portfolio\backend
- **Local URL:** http://localhost:3001/docs
- **Producción físico:** /opt/darwinyusef.portfolio/backend
- **Producción URL:** https://api.darwinyusef.com

## Aquicreamos (Frontend)
- **Docker Compose:** G:\darwinyusef.portfolio\docker\services\aquicreamos.yml
- **Puerto contenedor:** 80
- **Producción URL:** https://aquicreamos.com

## Caddy (Reverse Proxy)
- **Carpeta:** G:\darwinyusef.portfolio\docker\caddy\
- **Caddyfile:** G:\darwinyusef.portfolio\docker\caddy\Caddyfile
- **Configuración aquicreamos.com:** reverse_proxy aquicreamos:80
