# ── Stage 1: Build ────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (cached unless package.json changes)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build
# Output: /app/dist/  (index.html + assets/)

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────
FROM nginx:alpine

# Copy built files from Stage 1 into Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx config (handles SPA routing + API proxy)
COPY nginx.conf /etc/nginx/nginx.conf

# Nginx listens on port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]