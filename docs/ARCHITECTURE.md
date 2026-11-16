# Architecture

## 1. High-level design

```text
Android / iOS / Web
      |
Expo Router universal client
      |
typed API client (contracts package)
      |
HTTPS REST API: /api/v1
Fastify modular monolith
      |
services + authorization
      |
Drizzle ORM (packages/db)
      |
PostgreSQL
  local Docker / cloud Neon

Optional providers:
Google OAuth identity
Google Drive backup/files
Google Calendar read-only events
```

## 2. Monorepo layout

```text
myday/
├── apps/
│   ├── client/              # Expo Router: Android, iOS and web
│   └── api/                 # Fastify server
├── packages/
│   ├── contracts/           # Zod schemas, API types
│   ├── core/                # Pure domain logic
│   └── db/                  # Drizzle schema, migrations, client
├── docs/
├── AGENTS.md
├── PROMPTS.md
├── IMPLEMENTATION_STATUS.md
├── pnpm-workspace.yaml
└── package.json
```

## 3. Client
One Expo Router app runs on Android, iOS and web. Use platform-specific files (`.native.ts`, `.web.ts`) when necessary. Shared code includes API contracts, validation and domain logic. Do not assume every native package works on web.

Offline storage:
- Native: SQLite via Expo SQLite.
- Web: IndexedDB (e.g. Dexie).
- Put these behind a small platform storage interface.
- Server remains canonical source of truth.

## 4. API
Fastify modular monolith. Suggested modules:
- auth
- users
- journal
- tags
- goals (later)
- attachments
- integrations/drive
- integrations/calendar
- backup
- sync
- developer-apps (future; not MVP)

All endpoints under `/api/v1`. Publish OpenAPI JSON and docs in development. Generate or maintain typed client from shared contracts. API must be usable by future apps without importing Expo code.

## 5. Database
PostgreSQL is canonical. Drizzle ORM schema and migrations live in `packages/db`. Local Docker PostgreSQL and Neon must use identical migrations. Use separate environment variables for runtime and migration connections if Neon pooling requires it.

## 6. Authentication and future integrations
Use Better Auth only after verifying current official Expo plugin and Fastify-compatible integration pattern. The auth implementation must support browser sessions and native bearer/session handling securely. Google sign-in is identity only. Drive/Calendar each require separate consent.

For future apps:
- Start with first-party OAuth clients and scoped access.
- Use short-lived access tokens and revocable refresh sessions.
- Do not distribute a shared API secret inside mobile apps.
- Do not create permanent broad API keys for client-side use.
- Record integration grants and allow revocation.
- Add audit logs for external app access before enabling third-party integrations.

## 7. Offline sync
Queue mutations with:
- operation UUID/idempotency key
- entity ID
- operation type
- base revision
- payload
- client timestamp
Server checks ownership and revision. If base revision is stale, return a conflict; client shows both versions or lets user resolve. Never last-write-wins silently.

## 8. Files and backup
PostgreSQL stores attachment metadata, not large binary data. Initially use Google Drive app-owned folder for user-authorized attachments/backups. Keep provider IDs, not public URLs, as durable references. Build backup as versioned JSON with manifest/checksum; restore must preview and validate before commit.

## 9. Deployment
Local:
- Docker PostgreSQL
- API and Expo dev server run locally

Cloud:
- Neon PostgreSQL
- API host and web host selected after checking current free-tier terms and compatibility
- HTTPS required
- CORS allowlist
- secrets in host secret manager
- migration job run separately from app startup

Nginx is optional for a self-hosted VPS reverse proxy. It is not needed simply to connect Neon to an app. A VPS may not be free.

## 10. Design principle
The API and database are platform-independent. Expo is one client, not the owner of the platform. Future applications integrate through API contracts, authentication and scopes.
