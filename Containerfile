# Multi-stage build for minimal image size

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables defaults
# 172.17.0.1 is localhost from docker, for debugging with a local Simplifier
ENV SIMPLIFIER_BASE_URL=http://172.17.0.1:8080
ENV NODE_ENV=production
ENV RUNNING_IN_DOCKER=true

# Run as non-root user for security
USER node

# Expose the standard MCP server port (though MCP typically uses stdio)
# This is mostly for documentation purposes
EXPOSE 3000

# Start the MCP server
CMD ["node", "dist/index.js"]
