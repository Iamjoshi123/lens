# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies
RUN npm ci --omit=dev --ignore-scripts

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security
RUN addgroup --system --gid 1001 lens && \
    adduser  --system --uid 1001 lens
USER lens

# Copy built output and production node_modules
COPY --from=builder --chown=lens:lens /app/dist ./dist
COPY --from=builder --chown=lens:lens /app/node_modules ./node_modules
COPY --from=builder --chown=lens:lens /app/package.json ./package.json

# Copy migration files (needed at runtime for db:migrate)
COPY --chown=lens:lens src/data/migrations ./src/data/migrations

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
