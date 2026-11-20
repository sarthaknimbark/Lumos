# MyDay Platform — One-Click Setup Script (PowerShell)
# Run from repository root: .\setup.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MyDay Platform — Environment Setup   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify Node.js
try {
    $nodeVersion = node -v
    Write-Host "[1/6] Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js LTS (v20 or v22) from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# 2. Verify or Install pnpm
try {
    $pnpmVersion = pnpm -v
    Write-Host "[2/6] pnpm detected: v$pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "[2/6] pnpm not found. Installing pnpm globally..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install pnpm via npm. Trying corepack..." -ForegroundColor Yellow
        corepack enable
        corepack prepare pnpm@latest --activate
    }
}

# 3. Setup Environment Files
Write-Host "[3/6] Setting up environment configuration..." -ForegroundColor Cyan
if (-not (Test-Path "apps\api\.env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" "apps\api\.env"
        Write-Host "  Created apps\api\.env from .env.example" -ForegroundColor Green
    }
} else {
    Write-Host "  apps\api\.env already exists (preserving existing settings)" -ForegroundColor Gray
}

# 4. Install all packages
Write-Host "[4/6] Installing all packages across monorepo..." -ForegroundColor Cyan
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: pnpm install encountered an issue. Retrying with --no-frozen-lockfile..." -ForegroundColor Yellow
    pnpm install --no-frozen-lockfile
}

# 5. Build Workspace Packages
Write-Host "[5/6] Building workspace packages (@myday/contracts, @myday/core, @myday/db)..." -ForegroundColor Cyan
pnpm build

# 6. Run Integration Test Suite
Write-Host "[6/6] Running API integration tests..." -ForegroundColor Cyan
pnpm test

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup completed successfully!         " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start development:" -ForegroundColor Cyan
Write-Host "  - Backend API:  pnpm dev:api   (http://localhost:4000/documentation)" -ForegroundColor White
Write-Host "  - Web Client:   pnpm dev:web   (http://localhost:8081)" -ForegroundColor White
Write-Host "  - Mobile Client:pnpm dev:client" -ForegroundColor White
Write-Host ""
