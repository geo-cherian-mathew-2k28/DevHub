# DevHub - Automated Test & Verification Suite (PowerShell)
$ErrorActionPreference = "Continue"

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "       DevHub Automated Verification Suite" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

$backendPass = $false
$smokePass = $false

# 1. Run Backend Pytest Suite
Write-Host "--- 1. Running Backend Unit & Integration Tests ---" -ForegroundColor Yellow
$backendContainer = docker compose ps -q backend 2>$null

if ($backendContainer) {
    Write-Host "Executing pytest inside running backend container..." -ForegroundColor Cyan
    docker compose exec -T backend pytest -v
    if ($LASTEXITCODE -eq 0) {
        $backendPass = $true
        Write-Host "`n[PASS] Backend tests passed successfully in container." -ForegroundColor Green
    } else {
        Write-Host "`n[FAIL] Backend tests failed." -ForegroundColor Red
    }
} else {
    Write-Host "Backend container is not running. Running tests via local python environment..." -ForegroundColor Yellow
    try {
        py -m pytest backend/tests -v
        if ($LASTEXITCODE -eq 0) {
            $backendPass = $true
            Write-Host "`n[PASS] Local backend tests passed." -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARN] Pytest not installed in local host Python. Start Docker Compose to run tests inside the container." -ForegroundColor Yellow
    }
}

# 2. Live Smoke Test against running environment
Write-Host "`n--- 2. Running Live Stack Smoke Tests ---" -ForegroundColor Yellow

try {
    # Check Frontend
    $fe = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[PASS] Frontend is responding (HTTP $($fe.StatusCode))." -ForegroundColor Green

    # Check Backend Health
    $health = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[PASS] Backend Liveness probe (/api/health) is healthy: $($health.status)." -ForegroundColor Green

    # Check Backend Readiness
    $ready = Invoke-RestMethod -Uri "http://localhost:8000/api/ready" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[PASS] Backend Readiness probe (/api/ready) is ready: $($ready.database)." -ForegroundColor Green

    # CRUD verification
    $taskTitle = "Smoke Test Task $(Get-Random)"
    $newTask = Invoke-RestMethod -Uri "http://localhost:8000/api/tasks" -Method Post -Body (@{
        title = $taskTitle
        description = "Automated smoke test validation"
        priority = "high"
        status = "pending"
    } | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[PASS] Task created successfully in PostgreSQL (ID: $($newTask.id))." -ForegroundColor Green

    # Retrieve created task
    $fetchedTask = Invoke-RestMethod -Uri "http://localhost:8000/api/tasks/$($newTask.id)" -TimeoutSec 3 -ErrorAction Stop
    if ($fetchedTask.title -eq $taskTitle) {
        Write-Host "[PASS] Task retrieved accurately by ID." -ForegroundColor Green
    } else {
        throw "Retrieved task did not match created task!"
    }

    # Clean up test task
    Invoke-RestMethod -Uri "http://localhost:8000/api/tasks/$($newTask.id)" -Method Delete -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[PASS] Task deleted cleanly." -ForegroundColor Green

    $smokePass = $true
} catch {
    Write-Host "[FAIL] Live smoke test failed or services are not running: $_" -ForegroundColor Red
    Write-Host "Make sure services are running with: docker compose up -d" -ForegroundColor Yellow
}

Write-Host "`n==============================================="
if ($backendPass -and $smokePass) {
    Write-Host "ALL TESTS PASSED! Project verification complete." -ForegroundColor Green
} elseif ($backendPass) {
    Write-Host "Unit tests passed. Start containers with dev-up to run smoke tests." -ForegroundColor Yellow
} else {
    Write-Host "Tests incomplete. Please review errors above." -ForegroundColor Red
}
Write-Host "===============================================`n"
