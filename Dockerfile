FROM node:22-slim

WORKDIR /app

# Install build tools needed for native addons (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application (Vite frontend + esbuild server)
RUN npm run build

# Expose the port (Cloud Run uses PORT env variable)
EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.mjs"]
