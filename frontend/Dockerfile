# ==============================================================================
# DevHub Frontend Dockerfile
# Multi-stage production build (Node.js compiler -> Nginx static runtime)
# ==============================================================================

# Stage 1: Build the React Application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies using layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy application source files
COPY tsconfig.json tsconfig.node.json vite.config.ts index.html ./
COPY public/ ./public/
COPY src/ ./src/

# Compile production bundles
RUN npm run build

# Stage 2: Serve optimized assets with minimal Nginx runtime
FROM nginx:1.27-alpine AS runtime

# Install curl in runtime stage for container healthcheck
RUN apk add --no-cache curl

# Copy custom Nginx configuration (reverse-proxy & SPA routing)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Health check using Nginx health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/nginx-health || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
