# ── Stage: Production image ───────────────────────────────────────────
FROM node:18-alpine

# Set working directory
WORKDIR /app

RUN apk add --no-cache openssl
# Copy package files first (layer caching — npm install only re-runs if
# package.json or package-lock.json actually changes)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy all source files
COPY . .

# Generate Prisma client (requires schema.prisma to be present)
RUN npx prisma generate

# Create uploads directory (will be overridden by Docker volume mount,
# but needs to exist in the image for the first run)
RUN mkdir -p uploads

# Expose the port Express listens on
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]

RUN apk add --no-cache openssl curl
