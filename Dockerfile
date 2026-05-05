# syntax=docker/dockerfile:1

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-slim AS builder

# Native-addon build tools (required by better-sqlite3, @discordjs/opus, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 \
        make \
        g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all dependencies (devDeps needed for vite build + native compilation)
COPY package*.json ./
RUN npm ci

# Copy source and build the Vite frontend
COPY . .
RUN npm run build

# Remove dev-only packages; native addons stay compiled, tsx/typescript are
# kept because they live in dependencies (not devDependencies).
RUN npm prune --omit=dev

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

# Reuse already-compiled node_modules from the builder – no build tools needed.
COPY --from=builder /app/node_modules ./node_modules

# Built frontend assets
COPY --from=builder /app/dist ./dist

# TypeScript server source (executed directly by tsx at runtime)
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
