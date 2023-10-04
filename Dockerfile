# Stage 1 - Build the base
FROM oven/bun:latest AS base
WORKDIR /app
COPY package*.json ./
COPY bun.lockb ./
COPY tsconfig.json .
RUN bun install 


# Stage 2 - Build the app
FROM base AS build
WORKDIR /app
COPY src ./src
RUN bun run build

# Stage 3 - Build the final image
FROM oven/bun:latest
WORKDIR /app
COPY package*.json ./
COPY bun.lockb ./
RUN bun install --production
COPY --from=build /app/build ./


CMD ["bun", "index.js"]
