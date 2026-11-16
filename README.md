# MyDay — Personal Platform Starter

MyDay is a private, cross-device diary and personal memory platform designed to become a reusable service for your future applications.

## Product direction
- One universal Expo application for Android, iOS and web.
- One independent TypeScript API used by the Expo app and future projects.
- PostgreSQL is the source of truth.
- Local PostgreSQL via Docker for development; Neon PostgreSQL for cloud.
- Drizzle ORM owns schema and migrations.
- Future apps integrate through documented, authenticated, versioned APIs — never by directly accessing the database.

## Architecture decisions
| Area | Choice |
|---|---|
| Monorepo | pnpm workspaces |
| Mobile + web | Expo + React Native + Expo Router |
| API | Node.js + Fastify + TypeScript |
| API contract | REST `/api/v1` + OpenAPI |
| Validation | Zod |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Local DB | Docker Compose PostgreSQL |
| Cloud DB | Neon PostgreSQL |
| Authentication | Better Auth with Google provider; Expo integration |
| Mobile offline | SQLite |
| Web offline | IndexedDB |
| Shared logic | `packages/core`, `packages/contracts` |
| File/backup integration | Google Drive, optional and separate from sign-in |
| Reverse proxy | Nginx only for later self-hosting; not needed for Neon/Vercel-style hosting |

## Read first
1. `AGENTS.md`
2. `docs/SYSTEM_REQUIREMENTS_AND_SETUP.md` (System checks & manual setup checklist)
3. `docs/IMPLEMENTATION_GUIDE.md` (Step-by-step roadmap from Phase 0 to 10)
4. `docs/DEPLOYMENT_GUIDE.md` (Fastify Web Service + Google Play Store guide)
5. `docs/PRODUCT_SPEC.md`
6. `docs/ARCHITECTURE.md`
7. `docs/DATABASE_SCHEMA.md`
8. `docs/SECURITY.md`
9. `docs/MANUAL_SETUP.md`
10. `PROMPTS.md`

## Important
This ZIP is a documentation/configuration starter, not a finished application. Use the prompts to have your coding agent scaffold and implement the app phase by phase. Do not ask it to generate the whole product in one shot.

## Quick start
See `docs/MANUAL_SETUP.md` for exact manual steps, local PostgreSQL, Neon, Google OAuth, Drizzle setup and deployment guidance.
