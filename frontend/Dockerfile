# syntax=docker/dockerfile:1

# --- Build stage: install deps and build the Nuxt/Nitro server bundle ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Where the in-container /graphql proxy should forward browser requests.
ARG NUXT_GRAPHQL_PROXY_TARGET=http://backend:8080/graphql
ENV NUXT_GRAPHQL_PROXY_TARGET=$NUXT_GRAPHQL_PROXY_TARGET
RUN npm run build

# --- Runtime stage: run the prebuilt Nitro server with node only ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
