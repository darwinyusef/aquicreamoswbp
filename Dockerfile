FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html

RUN apk add --no-cache curl

COPY --from=builder /app/dist .

COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 4321;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:4321/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
