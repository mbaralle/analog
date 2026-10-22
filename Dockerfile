FROM node:22-bookworm-slim AS build
WORKDIR /app

# Toolchain is only used if a native prebuild is unavailable.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json .npmrc ./
RUN npm ci --include=dev
COPY . .
# Runtime configuration and the database are deliberately absent during the build.
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_PATH=/data/data.db
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY scripts/import-database.mjs ./scripts/import-database.mjs
RUN mkdir /data && chown node:node /data
USER node
# Verify native SQLite support in the final image, as the actual application user.
RUN node --input-type=module -e "import Database from 'better-sqlite3'; const db = new Database(':memory:'); if (db.prepare('SELECT 1 AS ok').get().ok !== 1) process.exit(1); db.close();"
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"
CMD ["node", "build"]
