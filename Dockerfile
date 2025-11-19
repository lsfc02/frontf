# ═══════════════════════════════════════════════════════════════
# STAGE 1: Build do React
# ═══════════════════════════════════════════════════════════════
FROM node:18-alpine AS builder

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app

# Copia package.json e instala dependências
COPY package*.json ./
RUN npm install

# Copia código fonte e faz build
COPY . .
RUN npm run build

# ═══════════════════════════════════════════════════════════════
# STAGE 2: Nginx com configuração customizada
# ═══════════════════════════════════════════════════════════════
FROM nginx:stable-alpine

# ✅ COPIA CONFIGURAÇÃO CUSTOMIZADA DO NGINX
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia arquivos do build
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe porta 80
EXPOSE 80

# Inicia Nginx
CMD ["nginx", "-g", "daemon off;"]
