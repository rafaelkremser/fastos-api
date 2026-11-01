# The API's image for Fly.io (fly.toml). The migrations do not run here: Fly's
# release step applies them before each new version starts

# The full image has the compilers, in case a native module (bcrypt) has no
# prebuilt binary
FROM node:24 AS build
WORKDIR /app

# The postinstall generates the Prisma client from the schema
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# The same Node and Debian, without the compilers
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/prisma.config.ts ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3333
CMD ["node", "dist/main"]
