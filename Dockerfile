# Multi-stage build for production
FROM node:25-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:25-alpine AS runner

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Expose port
EXPOSE 4173

# Set environment to production
ENV NODE_ENV=production

# Health check for Coolify
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:4173/health || exit 1

# Start the server
CMD ["node", "server.js"]
