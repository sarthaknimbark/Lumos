# System Design Review & Architecture Rating — MyDay Platform

This document presents a comprehensive system design review, scoring, and architectural critique of the **MyDay Platform** based on standard software engineering principles, scalability requirements, and cross-platform mobile/web constraints.

---

## 1. Executive Scorecard

| Dimension | Score | Verdict |
| :--- | :---: | :--- |
| **1. Modularity & Platform Decoupling** | **9.6 / 10** | **Elite**. The API is designed as an independent platform; Expo is just one client. Future apps can integrate without modifying mobile code. |
| **2. Data Modeling & Persistence** | **9.3 / 10** | **Robust**. Relational schema, Drizzle ORM, UUIDs, `timestamptz`, external attachment references, and identical local/cloud migrations. |
| **3. Security, Privacy & Tenancy** | **9.6 / 10** | **Bank-Grade**. Server-enforced tenancy (`userId` never trusted from client), decoupled Google OAuth scopes, encrypted provider tokens, zero client secrets. |
| **4. Offline-First & Conflict Strategy** | **8.8 / 10** | **Pragmatic**. Base revision checks + idempotency keys prevent silent overwrites. Clean platform adapters (SQLite vs. IndexedDB). |
| **5. Scalability & Operational Simplicity** | **9.0 / 10** | **High Efficiency**. Fastify has minimal overhead; Neon pooled connections handle spikes; modular monolith keeps operations low-cost. |
| **6. Developer Experience & Type Safety** | **9.0 / 10** | **Unified**. Shared `packages/contracts` with Zod provides end-to-end type safety between client and server. |
| **Overall Weighted Score** | **9.2 / 10** | **Production-Ready Starter Blueprint (Grade: A+)** |

---

## 2. In-Depth Pillar Breakdown

### Pillar 1: System Topology & Boundary Separation (9.6 / 10)
* **Design**: Universal Client (Expo Router) + Fastify Modular Monolith REST API (`/api/v1`) + PostgreSQL.
* **Analysis**:
  * Instead of building an "Expo app with ad-hoc serverless handlers", MyDay is structured as an **independent backend platform**.
  * The Fastify API owns database access, validation, and domain logic. The Expo client consumes the API through a typed client generated from shared contracts.
  * Future applications (e.g. desktop menu bar apps, smart watch apps, CLI tools, or personal automations) connect through authenticated `/api/v1` endpoints with zero changes to the core mobile app.
* **Why it matters**: It prevents vendor lock-in and gives you a durable personal platform for years to come.

---

### Pillar 2: Data Architecture & Relational Modeling (9.3 / 10)
* **Design**: PostgreSQL 16 + Drizzle ORM + Docker (Local) / Neon (Cloud).
* **Analysis**:
  * Employs PostgreSQL relational strengths: unique constraints `(user_id, entry_date)` for the one-main-entry-per-day model, normalized tag mapping (`entry_tags`), and structured reflection sections (`entry_sections` for gratitude, highlights, and intentions).
  * Big binary files (attachments, image backups) are **not** stored as BLOBs in PostgreSQL; only provider metadata (`provider_file_id`, `mime_type`, `size_bytes`) is tracked in DB, keeping queries fast and storage costs near zero.
  * Drizzle ORM provides lightweight, typed SQL with compile-time query validation and predictable migrations that run identically across local Docker and Neon.
* **Recommendation**: Create a GIN full-text index on `journal_entries(title, body)` in Phase 2 to ensure fast keyword search as entries grow into the thousands.

---

### Pillar 3: Security, Privacy & Tenancy Architecture (9.6 / 10)
* **Design**: Zero-trust client context, decoupled OAuth scopes, server-side token encryption.
* **Analysis**:
  * **Scope Decoupling**: Google Sign-in is strictly for identity (`openid`, `email`, `profile`). Google Drive (backup/attachments) and Google Calendar (events) are isolated, optional connections requiring explicit, independent consent.
  * **Strict Tenant Isolation**: Every database query enforces authenticated `userId` derived from verified server session context. The client can never forge `userId`.
  * **Provider Token Safety**: Refresh tokens for Drive/Calendar are stored encrypted at rest (`TOKEN_ENCRYPTION_KEY`) and are never sent to the client.
  * **Zero Secrets in Client**: Public client bundle contains only `EXPO_PUBLIC_API_URL`.

---

### Pillar 4: Offline-First Synchronization (8.8 / 10)
* **Design**: Revision-based optimistic mutation queue + platform storage adapters.
* **Analysis**:
  * Does not use naive "last-write-wins", which often results in silent data loss.
  * Instead, each mutation packet carries:
    $$\text{Mutation} = \{\text{operationId}, \text{entityId}, \text{baseRevision}, \text{payload}, \text{timestamp}\}$$
  * If the server's revision is greater than `baseRevision`, it triggers a conflict UI allowing the user to review both versions.
* **Trade-off Analysis**: This is an optimistic revision queue, not a full CRDT (Conflict-free Replicated Data Type). For a single-user personal journal, this is the **exact right tradeoff**—CRDTs would add massive complexity without real benefit for single-author diary entries.

---

### Pillar 5: Scalability & Operational Simplicity (9.0 / 10)
* **Design**: Fastify modular monolith + Neon serverless connection pooling.
* **Analysis**:
  * **Fastify vs. Express**: Fastify delivers 2x–4x higher throughput and built-in schema serialization, keeping server resource footprints tiny (fits comfortably on free/hobby tiers).
  * **Neon Serverless Pooling**: Allows database connections to scale down when idle and handles bursty traffic without saturating PostgreSQL connection limits.
  * Avoids premature microservice complexity while keeping domain modules strictly separated.

---

## 3. Engineering Trade-offs & Watchpoints

1. **Metro Bundler in Monorepos**:
   * *Watch*: Metro does not natively resolve symlinked packages outside the app root unless configured with `watchFolders` and proper package exports.
   * *Solution*: Enforced in [`AGENTS.md`](file:///d:/myday-platform-starter/AGENTS.md) and [`docs/SYSTEM_REQUIREMENTS_AND_SETUP.md`](file:///d:/myday-platform-starter/docs/SYSTEM_REQUIREMENTS_AND_SETUP.md).
2. **Platform Storage Abstraction**:
   * *Watch*: SQLite (`expo-sqlite`) will crash if bundled into web builds.
   * *Solution*: Strict adherence to `.native.ts` and `.web.ts` platform extensions is essential.
3. **Database Migration Pipeline in Cloud**:
   * *Watch*: When using Neon connection pooling (`-pooler` subdomains), Drizzle migration transactions can fail because PgBouncer in transaction mode does not support prepared statements or advisory locks.
   * *Solution*: Direct connection URLs must be used for running migrations; pooled URLs for runtime traffic.

---

## 4. Final Verdict

The architecture is **mature, clean, and highly practical**. It gives you enterprise-grade type safety and security while staying lean enough for rapid single-developer or AI-assisted implementation.
