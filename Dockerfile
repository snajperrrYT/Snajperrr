# Multi-stage Dockerfile for Cloud Run
# Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Prepare pnpm (Corepack)
RUN corepack enable && corepack prepare pnpm@8.6.0 --activate

# Copy package manifests first for caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies and build
COPY . .
RUN pnpm install --frozen-lockfile --offline || pnpm install --frozen-lockfile || true
RUN pnpm run build --if-present

# Production image
FROM node:20-alpine
WORKDIR /app

# Install only prod deps (optional)
RUN corepack enable && corepack prepare pnpm@8.6.0 --activate
COPY package.json pnpm-lock.yaml* ./
COPY --from=builder /app/dist ./dist
RUN pnpm install --prod --frozen-lockfile || true

EXPOSE 8080
# Cloud Run listens on PORT env var — default 8080
CMD ["node","dist/server.cjs"]
