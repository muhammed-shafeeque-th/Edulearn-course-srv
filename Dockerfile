# =========================
# Stage 1: Builder
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Enable Corepack (ensures correct Yarn version)
RUN corepack enable

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ bash

# Copy Yarn dependency manifests
COPY package.json yarn.lock ./

# Install all dependencies (including dev)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build


# =========================
# Stage 2: Production
# =========================
FROM node:20-alpine AS production

WORKDIR /app

# Enable Corepack
RUN corepack enable

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependency manifests
COPY package.json yarn.lock ./

# Install ONLY production dependencies
ENV NODE_ENV=production
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copy built output
COPY --from=builder /app/dist ./dist

# Copy proto files
COPY --from=builder /app/proto ./proto

# Fix permissions
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start application
CMD ["node", "dist/main.js"]
