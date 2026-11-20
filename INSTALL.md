# MyDay Platform — Installation & Package Manifest

This file documents all packages used across the MyDay platform and provides a complete guide to install, configure, and run the project smoothly on any new machine (Windows, macOS, or Linux).

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [One-Command Quick Start](#2-one-command-quick-start)
3. [Environment Configuration (`.env`)](#3-environment-configuration)
4. [Zero-DB Mode vs. Real PostgreSQL Setup](#4-zero-db-mode-vs-real-postgresql-setup)
5. [Complete Package Manifest](#5-complete-package-manifest)
6. [Daily Development Commands](#6-daily-development-commands)
7. [Device & Emulator Connectivity](#7-device--emulator-connectivity)
8. [Troubleshooting Guide](#8-troubleshooting-guide)

---

## 1. Prerequisites

Before installing, ensure the new machine has:

- **Node.js**: LTS version (Node 20 LTS or Node 22 LTS recommended) — [nodejs.org](https://nodejs.org)
- **pnpm**: Fast, disk-space efficient package manager (v9 or v10+)
  ```bash
  # Enable via Node corepack:
  corepack enable
  corepack prepare pnpm@latest --activate
  
  # Or install globally with npm:
  npm install -g pnpm
  ```
- **Git**: Installed and in PATH.
- **PostgreSQL (Optional for initial run)**:
  - The API includes an automated in-memory fallback. You can run and test the complete app immediately without a running database.
  - For real persistence, you can use Docker (`docker compose up -d db`), a local PostgreSQL installation, or a free cloud database (such as Neon).

---

## 2. One-Command Quick Start

Run the automated setup script for your operating system from the repository root. The script verifies Node/pnpm, auto-generates `.env` files, installs all workspace dependencies, builds packages, and runs the integration test suite.

### Windows (PowerShell)
```powershell
.\setup.ps1
```
*(If PowerShell blocks script execution, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first)*

### Windows (Command Prompt / Double Click)
```cmd
setup.bat
```

### macOS / Linux (Terminal)
```bash
chmod +x setup.sh && ./setup.sh
```

### Manual Setup (Step-by-Step)
```bash
# 1. Install all monorepo dependencies
pnpm install

# 2. Setup environment files
cp .env.example apps/api/.env
echo EXPO_PUBLIC_API_URL=http://localhost:4000 > apps/client/.env

# 3. Build shared packages (@myday/contracts, @myday/core, @myday/db)
pnpm build

# 4. Verify API test suite
pnpm test
```

---

## 3. Environment Configuration

### A. Backend API (`apps/api/.env`)
Create `apps/api/.env` from `.env.example`:

```ini
# Server Environment
NODE_ENV=development
PORT=4000
HOST=0.0.0.0
API_BASE_URL=http://localhost:4000
APP_WEB_URL=http://localhost:8081
CORS_ORIGIN=http://localhost:8081

# PostgreSQL (Only required if connecting to real PostgreSQL)
DATABASE_URL=postgresql://myday:myday_local_password@localhost:5432/myday

# Authentication Secret (Minimum 32 random characters)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=dev_secret_change_this_before_production_32x

# Token Encryption Key (For encrypting provider refresh tokens at rest — AES-256-GCM)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
TOKEN_ENCRYPTION_KEY=dev_token_key_change_before_production_32x

# Google OAuth (Optional: only needed if enabling live Google Sign-In or Google Drive backup)
# Configure credentials at https://console.cloud.google.com
# Drive uses isolated app-specific scopes: drive.appdata and drive.file
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Groq Free API (Optional: free API key from https://console.groq.com)
# Powers the AI reflection assistant; falls back to local curated prompts if empty
GROQ_API_KEY=
```

### B. Client Application (`apps/client/.env`)
Create `apps/client/.env`:

```ini
# API endpoint accessed by the client
# For Web browser: http://localhost:4000
# For Android Emulator: http://10.0.2.2:4000
# For Physical Device (Expo Go): http://<YOUR_COMPUTER_LAN_IP>:4000
EXPO_PUBLIC_API_URL=http://localhost:4000
```

---

## 4. Zero-DB Mode vs. Real PostgreSQL Setup

The platform is designed to be resilient and modular:

### Zero-DB Mode (Default out-of-the-box)
- If `DATABASE_URL` is commented out or PostgreSQL is not running, the API automatically falls back to its in-memory transactional store.
- All endpoints (journal CRUD, date navigation, search, tags, mood/energy, Groq reflection, offline sync, Google Drive backup snapshots, restore preview, and attachments) work 100% seamlessly.
- Perfect for quickly testing UI, running automated tests, or evaluating the client without spinning up Docker/PostgreSQL.

### Google Drive Integration (Phase 7)
- **App-Owned Storage**: Backups use isolated `drive.appdata` / `drive.file` scopes so the app never accesses the user's personal Drive documents.
- **AES-256 Token Encryption**: Provider refresh tokens are encrypted at rest with `TOKEN_ENCRYPTION_KEY`. Tokens never leak into logs or client bundles.
- **Safe Restore Workflow**: Backup snapshots include SHA-256 checksums and entry counts. The restore flow validates snapshots and supports both **Merge** (keeps newer entries) and **Overwrite** modes.
- **Simulation Mode**: Works immediately in development without live Google Cloud credentials. When ready for production, enable "Google Drive API" in Google Cloud Console and set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### Real PostgreSQL Persistence
When you want real, persistent data storage:
1. **Start PostgreSQL**:
   ```bash
   # Option A: Local Docker container
   docker compose up -d db

   # Option B: Local PostgreSQL service or Neon cloud PostgreSQL
   ```
2. **Set `DATABASE_URL`** in `apps/api/.env`.
3. **Run Drizzle Migrations**:
   ```bash
   pnpm db:migrate
   ```
4. **Seed Sample Data (Optional)**:
   ```bash
   pnpm db:seed
   ```

---

## 5. Complete Package Manifest

### Monorepo Root (`package.json`)
| Package | Version | Purpose |
|---|---|---|
| `pnpm` | `11.20.0` | Monorepo workspace package manager with hoisted node-linker |
| `typescript` | `^5.7.3` | Monorepo-wide strict TypeScript compiler |
| `@types/node` | `^22.13.0` | Node.js type definitions |
| `prettier` | `^3.5.0` | Consistent code formatting across all files |

---

### Backend API (`apps/api/package.json`)
| Package | Version | Purpose |
|---|---|---|
| `fastify` | `^5.2.1` | High-performance, low-overhead HTTP web framework |
| `@fastify/cors` | `^10.0.2` | Cross-Origin Resource Sharing handling for web clients |
| `@fastify/cookie` | `^11.0.2` | HTTP-only cookie parsing and signing for sessions |
| `@fastify/rate-limit` | `^10.2.2` | Brute-force and DoS request rate limiter |
| `@fastify/sensible` | `^6.0.3` | Standard HTTP errors and utilities |
| `@fastify/swagger` | `^9.4.2` | OpenAPI 3.x specification generator |
| `@fastify/swagger-ui` | `^5.2.2` | Interactive Swagger UI documentation at `/documentation` |
| `better-auth` | `^1.7.26` | Modern authentication framework (email/password & Google OAuth) |
| `groq-sdk` | `^1.6.0` | Groq Free API client (`llama-3.1-8b-instant`) for reflection AI |
| `zod` | `^3.24.2` | Runtime schema validation |
| `dotenv` | `^16.4.7` | Loads environment variables from `.env` |
| `tsx` *(dev)* | `^4.19.2` | TypeScript execution & hot-reload test runner |
| `@types/fastify-cors` *(dev)* | `^2.1.0` | Fastify CORS TypeScript definitions |

---

### Universal Client (`apps/client/package.json`) — Android, iOS & Web
| Package | Version | Purpose |
|---|---|---|
| `expo` | `~52.0.49` | Universal Expo SDK 52 framework |
| `expo-router` | `~4.0.17` | File-based routing for mobile and web |
| `react` | `18.3.1` | React core library |
| `react-dom` | `18.3.1` | React DOM renderer for browser runtime |
| `react-native` | `0.76.7` | React Native mobile runtime |
| `react-native-web` | `~0.19.13` | Compiles React Native components to standard HTML/CSS for web |
| `react-native-screens` | `~4.4.0` | Native navigation screen memory management |
| `react-native-safe-area-context` | `4.12.0` | Inset management for notches, status bars, and navigation bars |
| `expo-secure-store` | `~14.0.0` | Hardware-backed encrypted Keychain (iOS) & Keystore (Android) |
| `@better-auth/expo` | `^1.7.26` | Better Auth client plugin for Expo React Native |
| `better-auth` | `^1.7.26` | Client auth types and session helpers |
| `expo-constants` | `~17.0.8` | Device and manifest constants |
| `expo-linking` | `~7.0.5` | Deep linking handling (`myday://`) |
| `expo-status-bar` | `~2.0.1` | Configurable system status bar |
| `query-string` | `^7.1.3` | URL query parameter parsing |
| `@babel/runtime` | `^7.25.0` | Babel runtime helpers for Metro bundler |

---

### Database Package (`packages/db/package.json`)
| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.38.4` | High-performance TypeScript ORM for PostgreSQL |
| `postgres` | `^3.4.5` | Fast PostgreSQL driver (Postgres.js) |
| `drizzle-kit` *(dev)* | `^0.30.4` | Migration generator, schema differ, and DB introspector |

---

### Contracts Package (`packages/contracts/package.json`)
| Package | Version | Purpose |
|---|---|---|
| `zod` | `^3.24.2` | Shared API request/response validation schemas & TypeScript types |

---

### Core Business Logic (`packages/core/package.json`)
| Package | Version | Purpose |
|---|---|---|
| `@myday/contracts` | `workspace:*` | Shared domain models, enums, and business validation rules |

---

## 6. Daily Development Commands

Run these commands from the monorepo root:

| Command | Action |
|---|---|
| `pnpm dev:api` | Starts Fastify backend with hot-reload at `http://localhost:4000` |
| `pnpm dev:web` | Starts Expo client in the browser at `http://localhost:8081` |
| `pnpm dev:client` | Starts Metro bundler for Expo Go or Android Emulator |
| `pnpm test` | Runs the 22 automated integration test suite |
| `pnpm typecheck` | Validates TypeScript across all workspaces (contracts, db, core, api, client) |
| `pnpm db:migrate` | Applies generated SQL migrations to connected PostgreSQL |
| `pnpm db:seed` | Populates database with sample diary entries, tags, and reflections |
| `pnpm build` | Compiles all TypeScript packages in dependency order |

---

## 7. Device & Emulator Connectivity

When testing on different targets, adjust `apps/client/.env` (`EXPO_PUBLIC_API_URL`):

| Target | `EXPO_PUBLIC_API_URL` Value | Notes |
|---|---|---|
| **Web Browser** | `http://localhost:4000` | Browser and API run on same machine |
| **Android Emulator** | `http://10.0.2.2:4000` | `10.0.2.2` is Android emulator's special alias to host computer's `127.0.0.1` |
| **iOS Simulator** | `http://localhost:4000` | iOS simulator shares network directly with macOS host |
| **Physical Phone (Expo Go)** | `http://192.168.1.XX:4000` | Replace with your computer's local Wi-Fi IP. Ensure phone & PC are on same Wi-Fi. |

---

## 8. Troubleshooting Guide

### 1. `pnpm` execution blocked on Windows PowerShell
- **Symptom**: `File ... cannot be loaded because running scripts is disabled on this system.`
- **Fix**: Open PowerShell as Administrator or run:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```

### 2. Port 4000 or 8081 already in use
- **Symptom**: `EADDRINUSE: address already in use 0.0.0.0:4000`
- **Fix (Windows)**:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
  ```
- **Fix (macOS/Linux)**:
  ```bash
  kill -9 $(lsof -t -i:4000)
  ```

### 3. Clear Expo / Metro Cache
- **Symptom**: Stale bundle errors or unexpected module resolution failures in Expo.
- **Fix**:
  ```bash
  cd apps/client
  npx expo start -c
  ```

### 4. Database migration error on new machine
- **Symptom**: `Connection refused at localhost:5432`
- **Fix**: Either start PostgreSQL via Docker (`docker compose up -d db`) or comment out `DATABASE_URL` in `apps/api/.env` to run in automatic zero-DB mock mode.
