# Step-by-Step Implementation Guide — MyDay Platform

This document outlines the execution roadmap for building the **MyDay Platform** from scratch. It bridges the system specifications with the actionable execution prompts found in [`PROMPTS.md`](file:///d:/myday-platform-starter/PROMPTS.md).

---

## 1. Execution Philosophy

* **Phased Execution**: We never build everything in one shot. Each phase has clear boundaries and must pass verification before moving to the next.
* **Platform-First Decoupling**: Fastify API is an independent backend platform; Expo is one client.
* **Low-Token Discipline**: Keep diffs minimal, test continuously, and update [`IMPLEMENTATION_STATUS.md`](file:///d:/myday-platform-starter/IMPLEMENTATION_STATUS.md) at each milestone.

---

## 2. Roadmap Overview

```
Step 0: Build Decisions & Dependency Locking (Prompt 0)
   ↓
Step 1: Monorepo Foundation & Tooling (Phase 0 / Prompt 1)
   ↓
Step 2: Universal Expo UI with Mock Data (Phase 1 / Prompt 2)
   ↓
Step 3: PostgreSQL Schema & Drizzle Migrations (Phase 2 / Prompt 3)
   ↓
Step 4: Fastify API Foundation & Contracts (Phase 3 / Prompt 4)
   ↓
Step 5: Better Auth & Google Sign-In (Phase 4 / Prompt 5)
   ↓
Step 6: Connected Diary CRUD & Search (Phase 5 / Prompt 6)
   ↓
Step 7: Multiplatform Offline Storage & Sync (Phase 6 / Prompt 7)
   ↓
Step 8: Google Drive Backup & Calendar (Phases 7 & 8 / Prompts 8 & 9)
   ↓
Step 9: Production Deployment & Google Play Release (Phases 9 & 10 / Prompts 10 & 11)
```

---

## 3. Detailed Step-by-Step Breakdown

### Step 0 — Architectural Lock & Build Decisions (Prompt 0)
* **Goal**: Select exact, compatible package versions and establish risk mitigations before scaffolding.
* **Tasks**:
  * Verify version matrix: Node LTS (v20/v22), Expo SDK (v52+), React Native (0.76+), Fastify (v4/v5), Drizzle ORM, Zod, and Better Auth.
  * Define monorepo Metro configuration strategy to resolve workspace packages.
  * Propose exact scripts and setup commands.
* **Deliverable**: [`docs/BUILD_DECISIONS.md`](file:///d:/myday-platform-starter/docs).
* **Done When**: Build decisions are reviewed and approved.

---

### Step 1 — Monorepo Foundation & Tooling (Phase 0 / Prompt 1)
* **Goal**: Establish the repository workspace structure and verify that all base runtimes start cleanly.
* **Tasks**:
  * Scaffold root `package.json`, TypeScript base config, Prettier, and ESLint.
  * Scaffold `apps/client`: Expo Router app configured for Android, iOS, and Web.
  * Scaffold `apps/api`: Fastify TypeScript application.
  * Scaffold packages: `packages/contracts` (Zod), `packages/core` (logic), and `packages/db` (Drizzle client).
  * Configure `apps/client/metro.config.js` with monorepo watch folders.
* **Verification**:
  * Local Docker PostgreSQL starts via `docker compose up -d db`.
  * Fastify API starts and responds at `GET http://localhost:4000/health`.
  * Expo app boots and renders on Android emulator and Web (`http://localhost:8081`).

---

### Step 2 — Universal UI Shell with Mock Data (Phase 1 / Prompt 2)
* **Goal**: Build the complete client UI experience using mock data, without backend dependencies.
* **Tasks**:
  * Implement mobile-first navigation: `Today`, `Timeline`, `Search`, and `Settings`.
  * Build the **Today** dashboard: journal editor, mood/energy sliders (1–5), gratitude, highlights, and tomorrow intention cards.
  * Build the **Timeline** screen: date picker, calendar overview, past entry previews.
  * Build the **Search** shell: keyword input, tag chips, date filters.
* **Verification**: UI is fully interactive, responsive on mobile and desktop, and supports dark/light themes.

---

### Step 3 — PostgreSQL & Drizzle Persistence (Phase 2 / Prompt 3)
* **Goal**: Implement the database persistence layer and migration pipeline.
* **Tasks**:
  * Implement schemas in `packages/db` according to [`DATABASE_SCHEMA.md`](file:///d:/myday-platform-starter/docs/DATABASE_SCHEMA.md) (`users`, `journal_entries`, `entry_sections`, `tags`, `attachments`).
  * Setup Drizzle Kit configuration (`drizzle.config.ts`).
  * Add typed DB client, migration runner, and local seed script.
  * Enforce foreign keys, UUID primary keys, and unique constraint `(user_id, entry_date)`.
* **Verification**: Initial migration runs cleanly against local Docker PostgreSQL; table constraints and indexes verified.

---

### Step 4 — Fastify API Foundation & Contracts (Phase 3 / Prompt 4)
* **Goal**: Build the modular API server with end-to-end type safety and validation.
* **Tasks**:
  * Define request/response Zod schemas in `packages/contracts`.
  * Implement modular Fastify routes under `/api/v1` for entries, tags, and search.
  * Add centralized error handling, request ID tracing, and rate-limiting.
  * Generate OpenAPI specification at `/api/v1/openapi.json`.
* **Verification**: Automated integration tests verify that bad requests are rejected with clear Zod validation messages.

---

### Step 5 — Authentication & Account Isolation (Phase 4 / Prompt 5)
* **Goal**: Implement secure user authentication and strict multi-tenant data isolation.
* **Tasks**:
  * Integrate Better Auth with Google identity provider on Fastify.
  * Implement session handling: HTTP-only cookies on Web; `expo-secure-store` on native Android/iOS.
  * Protect all API endpoints; derive `userId` strictly from verified session context.
* **Verification**: Cross-user tests prove User A cannot read, edit, or delete User B's entries.

---

### Step 6 — Connected Diary CRUD & Search (Phase 5 / Prompt 6)
* **Goal**: Connect the Expo UI to the live Fastify API for full journal functionality.
* **Tasks**:
  * Wire UI screens to the typed API client using TanStack Query.
  * Implement full journal CRUD, tag management, and PostgreSQL full-text search.
  * Add pagination, empty states, and loading skeletons.
* **Verification**: Creating or editing an entry on mobile persists in PostgreSQL and is retrievable across devices.

---

### Step 7 — Multiplatform Offline Storage & Sync (Phase 6 / Prompt 7)
* **Goal**: Enable full offline journal drafting and robust conflict resolution.
* **Tasks**:
  * Implement platform storage adapters: `storage.native.ts` (SQLite) and `storage.web.ts` (IndexedDB).
  * Build offline mutation queue (idempotency keys, base revisions, payloads).
  * Implement revision conflict UI: if a server revision changed, prompt user to review rather than silently overwriting.
* **Verification**: Disconnect internet, edit entry, reconnect internet, and verify queued changes sync cleanly.

---

### Step 8 — Google Drive Backup & Calendar Integration (Phases 7 & 8 / Prompts 8 & 9)
* **Goal**: Add optional cloud integrations with decoupled permissions.
* **Tasks**:
  * Implement separate opt-in Google Drive authorization for versioned JSON backups and attachments.
  * Implement separate opt-in Google Calendar connection to display the day's events in read-only mode.
  * Ensure the core journal remains 100% operational even if Google services are disconnected.
* **Verification**: Export a backup file, simulate data restore preview, and verify event display without write permissions.

---

### Step 9 — Production Deployment & Release (Phases 9 & 10 / Prompts 10 & 11)
* **Goal**: Deploy web services to production and release the Android app to Google Play Store.
* **Tasks**:
  * Configure Neon Cloud PostgreSQL and run production migrations.
  * Deploy Fastify API to a Node.js web service (Render, Railway, or VPS).
  * Deploy static Expo Web client to Vercel/Cloudflare.
  * Configure EAS Build (`app.json`, `eas.json`) and compile signed Android App Bundle (`.aab`).
  * Follow [`DEPLOYMENT_GUIDE.md`](file:///d:/myday-platform-starter/docs/DEPLOYMENT_GUIDE.md) to complete Google Play Console store listing, Data Safety declaration, and roll out to Internal/Closed testing.
* **Verification**: Live web app and installed Android release connect to production API and database over HTTPS.

---

## 4. How to Execute Prompts with the Agent

Whenever you are ready for the next phase, send the corresponding prompt command from [`PROMPTS.md`](file:///d:/myday-platform-starter/PROMPTS.md):

1. **Start Step 0**: Send `"Proceed with Prompt 0"`
2. **Start Step 1**: Send `"Proceed with Prompt 1"`
3. **Continue**: Move sequentially through Prompts 2 to 11.
