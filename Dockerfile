# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Install build tools needed for native addons (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install all dependencies (including devDependencies for building)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application (Vite frontend + esbuild server)
RUN npm run build

# Remove devDependencies to slim down node_modules for production
RUN npm prune --omit=dev

# Production stage
FROM node:22-slim

WORKDIR /app

# Copy production node_modules (with compiled native addons) from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.mjs ./server.mjs

# Expose the port (Cloud Run uses PORT env variable)
EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.mjs"]
