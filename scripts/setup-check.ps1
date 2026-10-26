# DevHub - Prerequisites and Environment Checker (PowerShell)
$ErrorActionPreference = "Continue"

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "       DevHub Workshop Pre-flight Check" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

function Check-Tool ($Name, $Command, [string[]]$Arguments) {
    try {
        $output = & $Command @Arguments 2>&1
        if ($LASTEXITCODE -eq 0 -or $output) {
            Write-Host "[OK] $Name is installed: " -ForegroundColor Green -NoNewline
            Write-Host ($output -split "`n")[0]
            return $true
        } else {
            Write-Host "[FAIL] $Name is not responding properly." -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "[FAIL] $Name was not found in PATH." -ForegroundColor Red
        return $false
    }
}

$allGood = $true

$allGood = (Check-Tool "Docker CLI" "docker" @("--version")) -and $allGood
$allGood = (Check-Tool "Docker Compose" "docker" @("compose", "version")) -and $allGood
$allGood = (Check-Tool "Docker Buildx" "docker" @("buildx", "version")) -and $allGood
$allGood = (Check-Tool "kubectl" "kubectl" @("version", "--client")) -and $allGood
$allGood = (Check-Tool "kind" "kind" @("version")) -and $allGood
$allGood = (Check-Tool "Node.js" "node" @("-v")) -and $allGood
$allGood = (Check-Tool "npm" "npm" @("-v")) -and $allGood

Write-Host "`nChecking Docker Engine Daemon..." -ForegroundColor Yellow
try {
    $daemon = docker info --format '{{.ServerVersion}}' 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker Engine daemon is running (version: $daemon)." -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Docker Desktop / daemon is not running! Please start Docker Desktop." -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "[FAIL] Docker daemon is not accessible." -ForegroundColor Red
    $allGood = $false
}

Write-Host "`nChecking Port Availability (3000, 8000, 5432)..." -ForegroundColor Yellow
foreach ($port in @(3000, 8000, 5432)) {
    $portActive = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($portActive) {
        Write-Host "[WARN] Port $port is already in use by process ID $($portActive.OwningProcess)." -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Port $port is available." -ForegroundColor Green
    }
}

Write-Host "`n-----------------------------------------------"
if ($allGood) {
    Write-Host "SUCCESS: Your environment is ready for the DevHub workshop!" -ForegroundColor Green
} else {
    Write-Host "ATTENTION: Please review any FAIL notices above before proceeding." -ForegroundColor Yellow
}
Write-Host "-----------------------------------------------`n"
