# Implementation Status

Current status: Phase 8 complete. Ready for Phase 9 (Export/import, security, testing).

## Phases
- [x] 0 — Monorepo and tooling
- [x] 1 — Expo universal UI shell (mock data)
- [x] 2 — PostgreSQL + Drizzle persistence (schema, migrations & client ready; live migration deferred to target machine)
- [x] 3 — API modules, OpenAPI & Groq Free AI integration
- [x] 4 — Authentication and account isolation (Better Auth + Google Sign-In structure + SecureStore)
- [x] 5 — Journal, calendar, search, mood, tags (Drizzle persistence + universal client integration)
- [x] 6 — Native/web offline drafts and sync (IndexedDB on web, SecureStore on native, queue & conflict UI)
- [x] 7 — Google Drive backup and attachments
- [x] 8 — Google Calendar read-only integration
- [ ] 9 — Export/import, security, testing
- [ ] 10 — Cloud deployment and Android release preparation

## Fixed decisions
- Universal client: Expo + React Native + Expo Router (Android/iOS/web)
- Dual-Mode Entry Creation: Immediate choice between **Type Mode** (rich text + structured sections) and **Record Mode** (live audio waveform recording + audio playback).
- In-line Picture Attachments: Photo memories bento grid with captions and lightbox viewer attachable across both modes.
- Design Language & Iconography: High-craft bespoke luxury OLED matte slate (`#08090c`), dark titanium card surfaces (`#11131a`), and hairline borders (`rgba(255,255,255,0.08)`). Zero colored emojis: 2px monochrome outline vector icons that fill solid with theme accents upon selection.
- Responsive Layout: Native bottom tab bar on mobile (<768px); collapsible left navigation rail + 680px editorial writing canvas + contextual bento rail on desktop web (≥768px).
- Backend: Fastify + TypeScript
- Database: PostgreSQL
- ORM: Drizzle
- Local database: Docker Compose
- Cloud database: Neon
- Monorepo: pnpm workspaces
- API: REST `/api/v1` + Fastify route validation
- AI Provider: Groq Free API (zero paid AI dependencies; opt-in reflection assistance)
- Offline: SQLite on native, IndexedDB on web
- Auth: Better Auth (Email/Password always available + Google OAuth opt-in; identity scopes only)
- Secure token storage: Expo SecureStore on native, HTTP-only cookies on web
- Cross-user ownership: Strict user isolation — unauthorized access to other user's records returns 404

## Latest completed work
- Phase 1: Universal UI shell implemented with mock data.
- Phase 2: PostgreSQL schema, Drizzle Kit configuration, generated SQL migrations (`packages/db/drizzle/0000_military_brood.sql`), typed DB client, migration runner, and seed scripts implemented. Live database migration is deferred to target machine (`pnpm db:migrate`).
- Phase 3: Fastify API foundation completed with full `/api/v1` route modules (`entries`, `tags`, `ai`), centralized error handling, custom request IDs, rate-limiting defaults, interactive Swagger UI (`/documentation`) and OpenAPI spec (`/api/v1/openapi.json`), Groq Free API integration (`llama-3.1-8b-instant`) with curated offline fallback prompts, and passing automated integration tests.
- Phase 4: Authentication & account isolation:
  - Better Auth configured in `apps/api/src/auth.ts` with Drizzle adapter and Fastify integration.
  - Better Auth route delegation mounted under `/api/auth/*` and `/api/v1/auth/session`.
  - Auth guard (`apps/api/src/middleware/auth.ts`) enforcing authenticated `userId`, with dev-only header bypass (`x-test-user-id`) for development/tests.
  - Client auth client configured (`apps/client/src/auth/client.ts`) with `@better-auth/expo` and platform-specific storage adapters (`storage.native.ts` with `expo-secure-store`, `storage.web.ts` with `localStorage`).
  - Added Auth DTO contracts in `packages/contracts/src/auth.ts`.
  - Added cross-user ownership isolation tests in `apps/api/test/api.test.ts` (cross-user read/update/delete returns 404). All 15 integration tests pass.
  - Full TypeScript typechecks clean across `packages/contracts`, `packages/db`, `apps/api`, and `apps/client`.
- Phase 5: Journal, calendar, search, mood, and tags:
  - Built unified `entryService.ts` supporting Drizzle PostgreSQL queries and in-memory store fallback.
  - Enforced one main entry per local diary date (`entryDate`), revision-based optimistic concurrency (`baseRevision`), soft-delete, and structured sections (`highlights`, `gratitude`, `learned`, `tomorrow`).
  - Implemented date navigation (`GET /api/v1/entries/by-date/:date`), offset pagination, mood/energy/tag/favorite filters, and full-text search.
  - Universal client API layer built (`apps/client/src/api/client.ts`).
  - Today screen updated with dynamic date navigation (`< Prev`, `Today`, `Next >`), Groq AI assistant trigger, mood/energy selectors, reflection sections, and live API saving.
  - Timeline and Search screens updated with live API querying, favorites filtering, tag filtering, and debounced text search.
  - 18 automated integration tests passing and 10 Expo static web routes cleanly exported.
- Phase 6: Native/web offline drafts and sync:
  - Defined offline sync contracts: `QueuedOperationSchema`, `SyncActionSchema`, `SyncStatusSchema`, `ConflictResolutionSchema` in `@myday/contracts`.
  - Built platform offline storage adapters: `storage.web.ts` (IndexedDB with LocalStorage fallback) and `storage.native.ts` (hardware-backed encrypted native store) under unified `storage.ts`.
  - Built `syncManager.ts` featuring local draft caching, idempotent queueing, background queue flush, exponential backoff, and conflict detection.
  - Added backend idempotency replay protection (`x-idempotency-key`) in Fastify `/api/v1/entries` ensuring network retries return cached results without duplicate writes or conflicts.
  - Integrated offline sync banner ("X offline changes waiting to sync", "Sync Now") and explicit Conflict Resolution Dialog in the Entry Editor ("Keep Server Version" vs "Overwrite with My Changes" — never silently overwrites).
  - 19 automated integration tests passing and clean Metro web bundle exported.
- Phase 7: Google Drive backup and attachments:
  - Added Drive & Attachment contracts in `@myday/contracts` (`DriveStatusResponse`, `DriveConnectInput`, `DriveBackupItem`, `DriveBackupListResponse`, `RestorePreviewRequest`, `RestorePreviewResponse`, `RestoreConfirmRequest`, `RestoreConfirmResponse`, `CreateAttachmentInput`, `AttachmentResponse`).
  - Implemented AES-256-GCM server-side token encryption for provider refresh tokens in `apps/api/src/services/driveService.ts` (`TOKEN_ENCRYPTION_KEY`). Tokens are never returned to clients or logged.
  - Implemented app-owned isolated folder (`drive.appdata` / `drive.file` scope) for versioned JSON backups with SHA-256 checksum validation.
  - Implemented backup snapshots, history listing, restore preview, and merge vs. overwrite restore options.
  - Implemented entry attachments metadata tracking linked to journal entries with file size (< 25MB) and MIME validation.
  - Mounted endpoints under `/api/v1/integrations/drive/*` and `/api/v1/entries/:id/attachments` with strict user ownership isolation.
- Phase 8: Google Calendar read-only integration:
  - Added Calendar contracts in `@myday/contracts` (`CalendarStatusResponse`, `CalendarConnectInput`, `CalendarEventItem`, `CalendarEventsResponse`).
  - Implemented strictly read-only calendar service requesting only `calendar.events.readonly` with zero event modification permissions.
  - Added routes under `/api/v1/integrations/calendar/*` with token encryption and simulated context for local dev.
  - Added Day Schedule Context card in the Today tab and connection settings card.
- Stitch Luxury UI Redesign & Dual-Mode Media Architecture:
  - Redesigned Today reflection canvas in `apps/client/app/(tabs)/index.tsx` based on the Stitch luxury design export.
  - Added **Dual-Mode Switcher**: Clean segmented toggle between `[ Type Reflection ]` and `[ Record Note ]`.
  - Added **Raw Audio Recording Studio & Acoustic Player**: Oscillating sound-wave bars, elapsed timer, play/pause controls, speed toggle (`1.2x`), strictly zero speech-to-text transcription to preserve voice privacy.
  - Added **Visual Captures Bento Grid**: 2-column photo grid with `+ Add Picture` (real web file upload & preview), remove buttons (`✕`), and timestamped captions.
  - Integrated Stitch design tokens in `apps/client/src/theme/index.ts` (`#11131a` canvas, `#191b23` / `#1d1f27` container surfaces, `#c0c1ff` iris accent, `#b50036` recording rose).
  - Added `AudioNoteAttachmentSchema` and `PhotoAttachmentSchema` to `@myday/contracts` and persisted in `entryService.ts`.
  - Verified 100% clean TypeScript typechecks across all 5 workspace projects, 23/23 API tests passing, and 10/10 static web routes cleanly exported in 1.07 MB.

## Manual Configuration Needed for Live Auth

To enable full production authentication when ready:
1. **`AUTH_SECRET`**:
   - In `apps/api/.env`, generate and set a high-entropy secret (min 32 characters):
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. **`DATABASE_URL`**:
   - When connecting PostgreSQL on the target machine:
     `DATABASE_URL=postgresql://user:password@host:5432/myday`
   - Run migrations: `pnpm db:migrate`
3. **Google OAuth (Optional for Google Sign-In)**:
   - Go to Google Cloud Console (https://console.cloud.google.com).
   - Create OAuth 2.0 Credentials (Web application).
   - Authorized redirect URI: `http://localhost:4000/api/auth/callback/google` (and production API URL).
   - Set in `apps/api/.env`:
     - `GOOGLE_CLIENT_ID=your_google_client_id`
     - `GOOGLE_CLIENT_SECRET=your_google_client_secret`
   - *Note*: Only identity scopes (`openid`, `email`, `profile`) are used. Drive and Calendar permissions are requested separately in later phases.
