# MyDay — Low-Token Implementation Prompts

Use prompts sequentially. Do not paste the entire documentation repeatedly. The agent must follow `AGENTS.md`.

## Prompt 0 — Inspect and plan (no implementation)
Read `AGENTS.md`, `IMPLEMENTATION_STATUS.md`, `README.md`, and the relevant docs listed there. Inspect the repository. Do not write application features. Propose a minimal pnpm monorepo structure, compatible package versions and exact setup commands. Identify risks around Expo web/native, Better Auth Expo support and Fastify integration. Verify current official docs for these packages. Create a concise `docs/BUILD_DECISIONS.md`. Wait for approval before major changes.

## Prompt 1 — Phase 0: monorepo
Implement Phase 0 only. Create pnpm workspace with `apps/client` Expo Router app and `apps/api` Fastify TypeScript app; create packages `contracts`, `core`, `db`. Configure TypeScript strict mode, ESLint, formatting, env validation, scripts and Docker PostgreSQL. Do not implement auth or diary features. Verify Expo app starts on Android emulator/device and web; verify API health endpoint and DB connection. Run checks and update status.

## Prompt 2 — Phase 1: universal UI
Read product spec and UI docs only. Build the MyDay UI using mock data: Today dashboard, journal editor, calendar/timeline, mood/energy, gratitude, highlights, lessons, tomorrow intention, tags, search shell, settings and responsive navigation. Make it polished, calm, minimal and mobile-first. Use Expo-compatible components. No backend, OAuth, Drive, Calendar or AI yet. Test Android and web. Update status.

## Prompt 3 — Phase 2: PostgreSQL + Drizzle
Implement the schema from `docs/DATABASE_SCHEMA.md` in `packages/db`. Configure Drizzle Kit, local Docker PostgreSQL and migrations. Add typed DB client, seed script and health check. Add indexes, foreign keys, unique constraints and migration docs. Verify migration against local PostgreSQL. Do not connect Neon or add auth yet.

## Prompt 4 — Phase 3: API foundation
Implement Fastify modules and `/api/v1` routes based on `docs/API_CONTRACT.md`. Add Zod validation from `packages/contracts`, Fastify schemas, Groq free API integration (for optional AI reflection assistance without paid services), centralized errors, request IDs, rate-limit defaults and health/readiness endpoints. Keep all DB access inside API. Add integration tests. For now use a development-only test identity behind an explicit local-only guard; never enable it in production.

## Prompt 5 — Phase 4: authentication
Implement Better Auth with Google sign-in using its current official documentation and Expo integration. Integrate with Fastify safely; do not assume a Next.js adapter. Verify cookie/session handling on web and secure token storage on native. Configure Google OAuth redirect URIs. Keep identity scopes minimal. Protect all API routes and add tests proving user A cannot access user B's data. Drive/Calendar consent must remain separate.

## Prompt 6 — Phase 5: diary features
Implement journal CRUD, one main entry per local diary date, title/body, mood, energy, gratitude, highlights, lessons, tomorrow intention, tags, favorites, date navigation, calendar/timeline and PostgreSQL search. Use API only; never query DB from client. Add pagination, validation and ownership tests. Update OpenAPI and status.

## Prompt 7 — Phase 6: offline
Implement platform-specific offline adapters: SQLite for native and IndexedDB for web. Start with local drafts and queued journal create/update operations. Add idempotency keys, base revisions, retry/backoff and conflict UI. Never silently overwrite. Avoid caching private API responses in a shared service-worker cache. Test offline creation/editing and reconnect on both web and Android.

## Prompt 8 — Phase 7: Google Drive
Add optional Drive integration as a separate user-authorized connection. Verify current Google scopes and provider rules. Keep tokens server-side and encrypted if stored. Add app-owned backup folder, versioned JSON backup, backup history, restore preview/confirmation, attachment metadata and disconnect. Keep diary usable without Drive. Never make files public by default.

## Prompt 9 — Phase 8: Google Calendar
Add separate optional, read-only Calendar connection. Display selected day's events in the diary. Request minimum read-only permission. Do not create, update or delete calendar events. Handle revocation, token expiry and disconnected state.

## Prompt 10 — Phase 9: export, security and quality
Implement JSON and Markdown export, validated import preview, data deletion workflow and account export. Run security audit, cross-user tests, input validation, rate-limit, file validation, accessibility, performance and dependency audit. Test native and web builds. Update docs and status.

## Prompt 11 — Phase 10: Neon, hosting and Android
Configure Neon PostgreSQL using environment variables and production migrations. Deploy API and web client to suitable free-tier hosting after checking current limits and terms. Configure HTTPS, CORS, allowed origins, secrets and backups. Build Android release with EAS Build. Document Play Console manual steps, signing, privacy policy, data safety and testing requirements. Never claim Play Store publication is complete until the user completes account/review steps.

## Reusable small-task prompt
Task: <one precise change>
Read: AGENTS.md, IMPLEMENTATION_STATUS.md and only the relevant section of <doc>.
Constraints: minimal diff; preserve architecture; no paid services; no unrelated refactor.
Plan first in <= 5 bullets. Implement, test, update status, report results in <= 8 bullets.

## Bug-fix prompt
Bug: <exact issue>
Expected: <expected behavior>
Reproduction/log: <details>
Inspect relevant files only. Identify root cause, add a regression test, make the smallest fix, run checks and update status. Do not rewrite architecture.

## Code review prompt
Review the current diff only against AGENTS.md and the relevant product/security/API docs. Look for correctness, ownership leaks, token exposure, migration issues, native/web incompatibility and missing tests. Do not modify files. Return only actionable findings ordered by severity.
