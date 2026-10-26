#!/usr/bin/env bash
# DevHub - Startup Script (Bash)

set -e

echo ""
echo "Starting DevHub Application Stack..."

# 1. Ensure .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# 2. Build and run containers
echo "Building and launching containers via Docker Compose..."
docker compose up -d --build

# 3. Wait for services to become healthy
echo "Waiting for services to become healthy..."
max_retries=20
retry=0
ready=0

while [ $retry -lt $max_retries ] && [ $ready -eq 0 ]; do
    sleep 2
    retry=$((retry + 1))
    if curl -s -f http://localhost:8000/api/ready >/dev/null 2>&1; then
        ready=1
    else
        printf "."
    fi
done

echo ""
if [ $ready -eq 1 ]; then
    echo ""
    echo "==============================================="
    echo "DevHub is now LIVE and fully operational!"
    echo "==============================================="
    echo "  Frontend Dashboard : http://localhost:3000"
    echo "  Backend API Docs   : http://localhost:8000/docs"
    echo "  Liveness Probe     : http://localhost:8000/api/health"
    echo "  Readiness Probe    : http://localhost:8000/api/ready"
    echo "==============================================="
    echo ""
    echo "Useful Commands:"
    echo "  View live logs   : docker compose logs -f"
    echo "  Check containers : docker compose ps"
    echo "  Stop containers  : docker compose down"
    echo ""
else
    echo "[WARN] Containers started, but /api/ready didn't respond within 40s."
    echo "Inspect logs with: docker compose logs -f"
fi
