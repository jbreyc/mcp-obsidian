# Build stage
FROM oven/bun:1.2.18-slim AS builder
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun build src/index.ts --target node --outdir=dist

# Runtime stage
FROM oven/bun:1.2.18-slim

# Install curl for health checks (minimal, secure)
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r mcp -g 1001 && useradd -r -g mcp -u 1001 -m mcp

WORKDIR /app

# Copy built application and package.json
COPY --from=builder --chown=mcp:mcp /app/dist ./dist
COPY --from=builder --chown=mcp:mcp /app/package.json ./

# Switch to non-root user
USER mcp

# Expose ports for HTTP and HTTPS modes
EXPOSE 4000 4443

# Health check using curl (simpler and more reliable)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${MCP_HTTP_PORT:-${MCP_HTTPS_PORT:-4000}}/health || exit 1

# Set entrypoint
ENTRYPOINT ["bun", "dist/index.js"]