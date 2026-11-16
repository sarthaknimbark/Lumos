# Implementation Status

Current status: Not started.

## Phases
- [ ] 0 — Monorepo and tooling
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
None.

## Blockers / decisions needed
None.
