# path: Dockerfile

# ============================
# Build stage
# ============================
FROM node:22-alpine AS builder

# We deliberately do NOT set NODE_ENV=production here,
# so that devDependencies (including Vite) are installed.

WORKDIR /app

# Install dependencies (including devDependencies)
COPY package*.json ./
RUN npm ci --include=dev

# Copy the rest of the source
COPY . .

# Build the Vite app
RUN npm run build

# ============================
# Runtime stage
# ============================
FROM nginx:stable-alpine

# Optional: set NODE_ENV only for runtime
ENV NODE_ENV=production

WORKDIR /usr/share/nginx/html

# Copy built assets from builder
COPY --from=builder /app/dist ./

# SPA-friendly Nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD \
  wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
