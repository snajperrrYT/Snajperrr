FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 8080
ENV PORT=8080

CMD ["node", "dist/server.cjs"]
