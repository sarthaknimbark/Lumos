# MyDay — Build Decisions & Technical Foundation

This document defines the architectural locks, dependency versions, monorepo resolution rules, and risk mitigations established for the MyDay platform.

---

## 1. Dependency & Compatibility Matrix

| Component | Target Version | Selection Rationale |
| :--- | :--- | :--- |
| **Node.js** | Recommended: v20 or v22 LTS (Current host: v24.12.0) | Target LTS v20/v22 for maximum Gradle and Metro stability. The monorepo scripts and TypeScript configuration are compatible with Node v20+. |
| **Package Manager** | `pnpm` (11.x / 10.x / 9.x) | Strict workspace dependency tree; prevents phantom dependencies. Configured with hoist patterns for React Native compatibility. |
| **Universal Client** | Expo SDK 52+ / React Native 0.76+ | Single universal codebase supporting Android, iOS, and Web with Expo Router. |
| **API Server** | Fastify v5.x | High-throughput, low-overhead HTTP framework with native schema validation support and modular plugin architecture. |
| **Contracts & Validation** | Zod v3.24+ | Shared request/response validation across Fastify and Expo client. |
| **Database & ORM** | PostgreSQL 16 + Drizzle ORM v0.38+ | Light SQL wrapper, zero query engine bloat, typed schema migrations across local Docker and cloud Neon. |
| **Authentication** | Better Auth (with Expo & Fastify plugins) | Modern session/token authentication with Google OAuth provider support, session cookies on web, and secure bearer headers on mobile. |
| **AI Provider** | Groq Free API (`groq-sdk`) | Zero paid AI hard dependencies. Fast, free-tier Llama 3 models for optional reflection assistance, daily intention prompts, and summarization. |
| **Offline Persistence** | Platform Adapters: Expo SQLite (native) / IndexedDB (web) | Clean separation via `.native.ts` and `.web.ts` preventing native crash in web bundle. |

---

## 2. Monorepo Structure & Resolution Rules

### Directory Layout
```text
myday/
├── apps/
│   ├── client/              # Expo Router universal app (Android / iOS / Web)
│   └── api/                 # Fastify REST API (/api/v1)
├── packages/
│   ├── contracts/           # Zod schemas, API types, DTOs
│   ├── core/                # Platform-independent business logic
│   └── db/                  # Drizzle ORM schema, migrations, DB client
├── docs/                    # Architecture, API specs, database schema
├── pnpm-workspace.yaml      # Monorepo workspace configuration
├── package.json             # Root scripts and workspace tooling
└── tsconfig.base.json       # Base TypeScript compiler settings
```

### Metro Monorepo Watch Configuration
In `apps/client/metro.config.js`, Metro must watch the workspace root and resolve packages from both the app and the monorepo root:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
```

### PNPM Hoisting Configuration
To ensure React Native Metro bundler and Gradle build plugins resolve dependencies seamlessly in a pnpm monorepo, `.npmrc` is configured with:
```ini
shamefully-hoist=false
node-linker=hoisted
```
This avoids symlink resolution breakage inside the React Native CLI and Metro on Windows.

---

## 3. Risks & Mitigations

1. **Metro Symlink Resolution on Windows**:
   - *Risk*: Windows symlinks in pnpm virtual store can break Metro file resolution or asset bundling.
   - *Mitigation*: Using `node-linker=hoisted` in `.npmrc` provides a flat `node_modules` structure while retaining pnpm's fast installation and workspace isolation.

2. **Native SQLite vs. Web Bundles**:
   - *Risk*: Importing `expo-sqlite` into the web bundle causes Webpack / Metro bundling failure.
   - *Mitigation*: Strict platform adapter pattern (`storage.native.ts` and `storage.web.ts`) behind a shared TypeScript interface in `packages/core` or `apps/client`.

3. **Better Auth Fastify Integration**:
   - *Risk*: Many modern auth libraries assume Next.js / serverless handlers.
   - *Mitigation*: Better Auth provides official Fastify plugins / handler adapters. Fastify acts as the central session/JWT authority; client receives secure session tokens.

4. **Database Connection Pooling in Neon vs. Migrations**:
   - *Risk*: Neon transaction pooling (port 6543) breaks Drizzle migration locks.
   - *Mitigation*: Migrations use direct connection string (`DATABASE_MIGRATION_URL` or non-pooled `DATABASE_URL`); runtime queries use pooled string if needed.

---

## 4. Phase 0 Verification Commands
- Monorepo install: `pnpm install`
- Typecheck all packages: `pnpm typecheck`
- Lint all packages: `pnpm lint`
- API Health Check: `pnpm --filter @myday/api dev` -> `GET http://localhost:4000/health`
- Expo Universal Client: `pnpm --filter @myday/client web`
