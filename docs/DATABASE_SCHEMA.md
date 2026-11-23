# PostgreSQL Schema Plan

Use UUID primary keys, `timestamptz` for instants, `date` for local diary dates, foreign keys, indexes and Drizzle migrations. Final schema must be implemented and reviewed by the coding agent.

## Core tables

### users
- id UUID primary key (align with auth user ID)
- name, email, image
- timezone TEXT (IANA timezone)
- created_at, updated_at

### Auth tables
Use Better Auth's current Drizzle adapter schema. Do not hand-invent auth tables; generate/configure them using the current official adapter docs.

### journal_entries
- id UUID
- user_id UUID FK users
- entry_date DATE
- title TEXT nullable
- body TEXT
- mood SMALLINT nullable (1–5)
- energy SMALLINT nullable (1–5)
- status TEXT constrained: `draft`, `published`
- is_favorite BOOLEAN default false
- revision INTEGER default 1
- created_at, updated_at, deleted_at nullable
- unique `(user_id, entry_date)` for MVP's one-main-entry-per-day model

### entry_sections
- id UUID, user_id UUID, entry_id UUID FK
- section_type constrained: `highlights`, `gratitude`, `learned`, `tomorrow`, `freeform`
- content TEXT, sort_order INTEGER
- created_at, updated_at

### tags
- id UUID, user_id UUID, name TEXT, normalized_name TEXT
- unique `(user_id, normalized_name)`

### entry_tags
- entry_id UUID FK, tag_id UUID FK
- composite primary key `(entry_id, tag_id)`

### attachments (Photos, Audio Notes & Documents)
- id UUID, user_id UUID, entry_id UUID FK
- media_type TEXT (`photo`, `audio_note`, `file`)
- provider TEXT (`google_drive`, `local`, `s3`)
- provider_file_id TEXT
- url TEXT
- filename TEXT, mime_type TEXT, size_bytes INTEGER
- duration_seconds INTEGER nullable (for audio notes)
- waveform JSONB nullable (array of audio levels for playback visualizer)
- caption TEXT nullable (for photo memories)
- width INTEGER nullable, height INTEGER nullable
- created_at TIMESTAMPTZ
- unique `(user_id, provider, provider_file_id)`

### goals (later)
- id, user_id, title, description, start_date, target_date
- status constrained: `active`, `completed`, `archived`
- created_at, updated_at

### integration_connections
- id, user_id, provider (`drive`, `calendar`)
- provider_account_id, scopes TEXT[]
- encrypted refresh token if needed, expires_at
- connected_at, updated_at
- unique `(user_id, provider)`

### external_apps (future phase, not MVP)
- id, owner_user_id, name, client_id, hashed_client_secret if confidential server app
- status, created_at, revoked_at
Do not issue a secret to a public mobile/web client.

### integration_grants (future phase, not MVP)
- id, user_id, external_app_id
- scopes TEXT[]
- granted_at, revoked_at

### audit_events (future phase)
- id, user_id, actor_type, actor_id, action, resource_type, resource_id, created_at
- Avoid storing diary body content in audit logs.

## Indexes
- journal_entries `(user_id, entry_date DESC)`
- journal_entries `(user_id, updated_at DESC)`
- tags `(user_id, normalized_name)`
- attachments `(user_id, entry_id)`
- GIN full-text index on entry title/body if needed.

## Data rules
- All owned rows include user_id where practical.
- Every query checks user_id from authenticated server context.
- Use transactions for entry + sections + tag updates.
- Soft-delete journal entries initially; provide permanent deletion/export workflow.
- Never give client or future app direct database credentials.
