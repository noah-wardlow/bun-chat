# # Stage 1 - Build the base
# FROM oven/bun:latest AS base
# WORKDIR /app
# COPY package*.json ./
# # COPY prisma ./prisma/
# COPY bun.lockb ./
# # COPY tschema.prisma ./prisma/
# COPY tsconfig.json .
# RUN bun install 
# RUN bunx prisma generate

# # RUN apt update \
# #     && apt install -y curl

# # # Install nodejs using n
# # ARG NODE_VERSION=18
# # RUN curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n \
# #     && bash n $NODE_VERSION \
# #     && rm n \
# #     && npm install -g n


# # Stage 2 - Build the app
# FROM base AS build
# WORKDIR /app
# COPY src ./src
# # RUN bun install prisma
# RUN bun run build

# # Stage 3 - Build the final image
# FROM oven/bun:latest
# WORKDIR /app
# COPY package*.json ./
# COPY bun.lockb ./
# RUN bun install --production
# COPY --from=build /app/build ./
# # COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma 


# CMD ["bun", "index.js"]

# # use the official Bun image
# # see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:latest as base
WORKDIR /app

# # install dependencies into temp directory
# # this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY tsconfig.json /temp/dev/
COPY package.json bun.lockb /temp/dev/

RUN cd /temp/dev && bun install --frozen-lockfile

# # install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# # copy node_modules from temp directory
# # then copy all (non-ignored) project files into the image
FROM install AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# # [optional] tests & build
ENV NODE_ENV=production
COPY . .
RUN bun run build

# # copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/build ./
COPY --from=prerelease /app/package.json .

# # run the app
USER bun
EXPOSE 3000/tcp
CMD ["bun", "run", "index.js"]
