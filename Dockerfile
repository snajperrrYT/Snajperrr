FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

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
