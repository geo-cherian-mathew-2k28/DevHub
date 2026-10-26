# DevHub - Startup Script (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "`nStarting DevHub Application Stack..." -ForegroundColor Cyan

# 1. Ensure .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

# 2. Build and run containers
Write-Host "Building and launching containers via Docker Compose..." -ForegroundColor Yellow
docker compose up -d --build

# 3. Wait for services to become healthy
Write-Host "Waiting for services to become healthy..." -ForegroundColor Yellow
$maxRetries = 20
$retry = 0
$ready = $false

while ($retry -lt $maxRetries -and -not $ready) {
    Start-Sleep -Seconds 2
    $retry++
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8000/api/ready" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($res.status -eq "ready") {
            $ready = $true
        }
    } catch {
        Write-Host -NoNewline "."
    }
}

Write-Host ""
if ($ready) {
    Write-Host "`n===============================================" -ForegroundColor Green
    Write-Host "DevHub is now LIVE and fully operational!" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "  Frontend Dashboard : http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  Backend API Docs   : http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "  Liveness Probe     : http://localhost:8000/api/health" -ForegroundColor Cyan
    Write-Host "  Readiness Probe    : http://localhost:8000/api/ready" -ForegroundColor Cyan
    Write-Host "===============================================`n" -ForegroundColor Green
    Write-Host "Useful Commands:" -ForegroundColor Yellow
    Write-Host "  View live logs   : docker compose logs -f"
    Write-Host "  Check containers : docker compose ps"
    Write-Host "  Stop containers  : docker compose down`n"
} else {
    Write-Host "`n[WARN] Containers started, but /api/ready didn't respond within 40s." -ForegroundColor Yellow
    Write-Host "Inspect logs with: docker compose logs -f" -ForegroundColor Yellow
}
