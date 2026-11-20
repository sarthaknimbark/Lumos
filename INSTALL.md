# MyDay Platform — Installation & Package Manifest

This file documents all packages used across the MyDay platform and provides a one-command setup guide to easily install and run the project on any new machine (Windows, macOS, or Linux).

---

## 1. Prerequisites for New Machine

Before installing, ensure your new machine has:

- **Node.js**: LTS version (Node 20 LTS or Node 22 LTS recommended) — [nodejs.org](https://nodejs.org)
- **pnpm**: Fast, disk-space efficient package manager (v9 or v10+)
  ```bash
  corepack enable
  corepack prepare pnpm@latest --activate
  # OR:
  npm install -g pnpm
  ```
- **PostgreSQL**: Optional for local testing (mock mode works out-of-the-box). For real persistence:
  - Docker Compose: `docker compose up -d db`
  - OR Local PostgreSQL 15+ / 16+ / 17+
  - OR Cloud Neon database URL

---

## 2. One-Command Setup

Run the setup script for your operating system from the repository root:

### Windows (PowerShell)
```powershell
.\setup.ps1
```

### macOS / Linux (Bash)
```bash
chmod +x setup.sh && ./setup.sh
```

### Manual Installation (Cross-Platform)
```bash
# 1. Install all dependencies across all workspaces
pnpm install

# 2. Setup environment variables
cp .env.example apps/api/.env

# 3. Build shared packages and run tests
pnpm build
pnpm test
```

---

## 3. Package Manifest (All Packages by Workspace)

### Monorepo Root (`package.json`)
| Package | Version | Purpose |
|---|---|---|
| `pnpm` | `11.20.0` | Workspace package manager with hoisted node-linker |
| `typescript` | `^5.7.3` | Monorepo-wide strict TypeScript compiler |
| `@types/node` | `^22.13.0` | Node.js type definitions |
| `prettier` | `^3.5.0` | Code formatting across all files |

---

### Backend API (`apps/api`)
| Package | Version | Purpose |
|---|---|---|
| `fastify` | `^5.2.1` | High-performance, low-overhead HTTP web framework |
| `@fastify/cors` | `^10.0.2` | Cross-Origin Resource Sharing handling |
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

---

### Universal Client (`apps/client`) — Android, iOS & Web
| Package | Version | Purpose |
|---|---|---|
| `expo` | `~52.0.49` | Universal Expo SDK 52 framework |
| `expo-router` | `~4.0.17` | File-based routing for mobile and web |
| `react` | `18.3.1` | React library |
| `react-dom` | `18.3.1` | React DOM renderer for web |
| `react-native` | `0.76.7` | React Native mobile runtime |
| `react-native-web` | `~0.19.13` | Runs React Native components in standard browsers |
| `react-native-screens` | `~4.4.0` | Native navigation screen primitives |
| `react-native-safe-area-context` | `4.12.0` | Safe area insets (notches, status bars, navigation pills) |
| `expo-secure-store` | `~14.0.0` | Hardware-backed encrypted keychain/keystore token storage |
| `@better-auth/expo` | `^1.7.26` | Better Auth client plugin for Expo React Native |
| `better-auth` | `^1.7.26` | Client auth types and session helpers |
| `expo-constants` | `~17.0.8` | System and app constants |
| `expo-linking` | `~7.0.5` | Deep linking handling (`myday://`) |
| `expo-status-bar` | `~2.0.1` | Status bar styling |
| `query-string` | `^7.1.3` | URL query parameter parsing |
| `@babel/runtime` | `^7.25.0` | Babel runtime helpers for Metro bundler |

---

### Database Package (`packages/db`)
| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.38.4` | TypeScript ORM for PostgreSQL |
| `postgres` | `^3.4.5` | Fast PostgreSQL client driver (Postgres.js) |
| `drizzle-kit` *(dev)* | `^0.30.4` | Migration generator and DB introspector |

---

### Contracts Package (`packages/contracts`)
| Package | Version | Purpose |
|---|---|---|
| `zod` | `^3.24.2` | Shared API request/response validation schemas & TypeScript types |

---

### Core Business Logic (`packages/core`)
| Package | Version | Purpose |
|---|---|---|
| `@myday/contracts` | `workspace:*` | Shared domain models and validation rules |

---

## 4. Environment Variables (`apps/api/.env`)

On your new machine, copy `.env.example` to `apps/api/.env` and update the following:

```ini
# Server Environment
NODE_ENV=development
PORT=4000
HOST=0.0.0.0
API_BASE_URL=http://localhost:4000
APP_WEB_URL=http://localhost:8081

# PostgreSQL (Set when connecting your database on the target system)
DATABASE_URL=postgresql://user:password@localhost:5432/myday

# Auth Secret (Minimum 32 characters)
AUTH_SECRET=generate_32_characters_random_hex_string

# Google OAuth (Optional: only needed if enabling Google Sign-In)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Groq Free API (Optional: free API key from https://console.groq.com)
GROQ_API_KEY=
```

---

## 5. Daily Development Commands

```bash
# Start backend API (with hot-reload)
pnpm dev:api

# Start client on Web (http://localhost:8081)
pnpm dev:web

# Start client for Expo Go / Android
pnpm dev:client

# Run database migrations (when PostgreSQL is connected)
pnpm db:migrate

# Seed database with sample data
pnpm db:seed

# Run integration tests
pnpm test

# Typecheck all packages
pnpm typecheck
```
