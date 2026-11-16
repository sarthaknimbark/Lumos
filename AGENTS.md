# AGENTS.md — MyDay Platform

## Mission
Build MyDay as an independent personal platform: universal Expo client + independent Fastify API + PostgreSQL. Other future apps must integrate through the authenticated, versioned API.

## Read order
1. This file.
2. `IMPLEMENTATION_STATUS.md`.
3. Relevant section of `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `docs/API_CONTRACT.md` or `docs/SECURITY.md`.
4. Current task in `PROMPTS.md`.

Do not reread all docs for every small task.

## Architecture rules
- Monorepo using pnpm workspaces.
- `apps/client`: one Expo Router app for Android, iOS and web.
- `apps/api`: Fastify API; all database access stays server-side.
- `packages/db`: Drizzle schema, migrations and DB client.
- `packages/contracts`: Zod request/response schemas and shared API types.
- `packages/core`: platform-independent business rules only.
- PostgreSQL is the source of truth. Local Docker DB and Neon use the same migrations.
- API prefix `/api/v1`; document endpoints with OpenAPI.
- Future applications integrate through API + scopes/permissions. Never give other apps direct database credentials.
- Keep domain modules separate: identity, journal, tags, attachments, goals, integrations, backup, sync.
- Prefer a modular monolith. Do not introduce microservices without a proven need.

## Code quality
- TypeScript strict mode; avoid `any`.
- Validate all untrusted input with Zod.
- Use Drizzle parameterized queries and migrations.
- Every user-owned query filters by authenticated `userId`; never trust a client-supplied owner ID.
- Use platform adapters for native SQLite and web IndexedDB; do not import native-only modules into web bundles.
- Keep UI platform-specific when necessary, while sharing contracts and business logic.
- Use accessible responsive UI and explicit loading/empty/error states.
- Store instants as `timestamptz`; diary day as SQL `date`; store user IANA timezone.
- Do not silently overwrite offline conflicts.

## Privacy and integrations
- Google sign-in is not blanket permission to Drive or Calendar.
- Request Drive and Calendar permissions separately, only when the user enables those features.
- Provider tokens stay server-side, encrypted if persisted; never log or return them.
- No diary content sent to AI services by default.
- No paid APIs or paid services as hard dependencies. Never enable paid billing without explicit approval.
- Core diary must work if Google integrations are disconnected.

## Token discipline
- Inspect only relevant files.
- Before editing, state a plan in 3–6 bullets.
- Make the smallest focused diff; no unrelated refactors.
- Do not print whole files in chat.
- After changes, run relevant lint/typecheck/tests and report changed files, results and blockers in <= 8 bullets.
- Update `IMPLEMENTATION_STATUS.md` when a phase changes.
- If package APIs or provider instructions may have changed, consult current official docs rather than guessing.

## Definition of done
- Acceptance criteria pass.
- Relevant tests, lint and typecheck pass.
- Ownership and authorization tested.
- No secrets committed or exposed to client.
- API contract and docs updated.
- Both native and web builds considered for cross-platform changes.
