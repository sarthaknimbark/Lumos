# Implementation Status

Current status: Phase 0 complete. Ready for Phase 1.

## Phases
- [x] 0 — Monorepo and tooling
- [ ] 1 — Expo universal UI shell (mock data)
- [ ] 2 — PostgreSQL + Drizzle persistence
- [ ] 3 — API modules and OpenAPI
- [ ] 4 — Authentication and account isolation
- [ ] 5 — Journal, calendar, search, mood, tags
- [ ] 6 — Native/web offline drafts and sync
- [ ] 7 — Google Drive backup and attachments
- [ ] 8 — Google Calendar read-only integration
- [ ] 9 — Export/import, security, testing
- [ ] 10 — Cloud deployment and Android release preparation

## Fixed decisions
- Universal client: Expo + React Native + Expo Router (Android/iOS/web)
- Backend: Fastify + TypeScript
- Database: PostgreSQL
- ORM: Drizzle
- Local database: Docker Compose
- Cloud database: Neon
- Monorepo: pnpm workspaces
- API: REST `/api/v1` + OpenAPI
- Offline: SQLite on native, IndexedDB on web
- Google integrations: separate opt-in permissions

## Latest completed work
- Phase 0: Monorepo established with pnpm workspaces.
- Created `apps/client` (Expo Router universal app), `apps/api` (Fastify v5 TypeScript app), `packages/contracts` (Zod), `packages/core`, and `packages/db`.
- Configured Metro monorepo watch folders, hoisted dependency resolution, and strict TypeScript.
- Verified Fastify `/health` and `/api/v1/health` endpoints.
- Verified Expo Router universal bundling for web and native.
- Created `docs/BUILD_DECISIONS.md`.

## Blockers / decisions needed
None. Ready to begin Phase 1 (Universal UI shell with mock data).
