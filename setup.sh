#!/usr/bin/env bash
# MyDay Platform — One-Click Setup Script (macOS / Linux)
# Run from repository root: chmod +x setup.sh && ./setup.sh

set -e

echo "========================================"
echo "  MyDay Platform — Environment Setup   "
echo "========================================"
echo ""

# 1. Verify Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "Please install Node.js LTS (v20 or v22) from https://nodejs.org"
    exit 1
fi
echo "[1/6] Node.js detected: $(node -v)"

# 2. Verify or Install pnpm
if ! command -v pnpm &> /dev/null; then
    echo "[2/6] pnpm not found. Installing pnpm globally..."
    npm install -g pnpm || {
        corepack enable
        corepack prepare pnpm@latest --activate
    }
fi
echo "[2/6] pnpm detected: v$(pnpm -v)"

# 3. Setup Environment Files
echo "[3/6] Setting up environment configuration..."
if [ ! -f "apps/api/.env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example apps/api/.env
        echo "  Created apps/api/.env from .env.example"
    fi
else
    echo "  apps/api/.env already exists (preserving existing settings)"
fi
if [ ! -f "apps/client/.env" ]; then
    echo "EXPO_PUBLIC_API_URL=http://localhost:4000" > apps/client/.env
    echo "  Created apps/client/.env with EXPO_PUBLIC_API_URL=http://localhost:4000"
else
    echo "  apps/client/.env already exists (preserving existing settings)"
fi

# 4. Install all packages
echo "[4/6] Installing all packages across monorepo..."
pnpm install || pnpm install --no-frozen-lockfile

# 5. Build Workspace Packages
echo "[5/6] Building workspace packages (@myday/contracts, @myday/core, @myday/db)..."
pnpm build

# 6. Run Integration Test Suite
echo "[6/6] Running API integration tests..."
pnpm test

echo ""
echo "========================================"
echo "  Setup completed successfully!         "
echo "========================================"
echo ""
echo "To start development:"
echo "  - Backend API:   pnpm dev:api   (http://localhost:4000/documentation)"
echo "  - Web Client:    pnpm dev:web   (http://localhost:8081)"
echo "  - Mobile Client: pnpm dev:client"
echo ""
