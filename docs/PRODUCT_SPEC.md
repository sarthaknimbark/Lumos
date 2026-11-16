# Product Specification

## Product
MyDay is a private personal diary and memory platform. It is initially single-user in product intent but must support secure multi-account architecture so future integrations and deployments remain possible.

## Primary outcomes
- Capture daily thoughts and events quickly.
- Revisit memories by date, calendar, timeline and search.
- Use on Android, iOS and web through one Expo universal app.
- Work offline for diary drafting and sync safely later.
- Own and export personal data.
- Allow future applications and personal agents to integrate through a documented API with explicit permissions.

## MVP features
1. Google sign-in.
2. Today dashboard and daily entry editor.
3. One primary diary entry per local date (schema can later support multiple entries).
4. Mood and energy rating.
5. Structured reflection sections: highlights, gratitude, learned, tomorrow.
6. Tags, favorites and search.
7. Calendar and timeline.
8. Attachments and memories (later phase).
9. JSON/Markdown export.
10. Offline drafts and sync.
11. Optional Google Drive backup.
12. Optional read-only Google Calendar context.

## UX principles
- Calm, minimal, private, fast and distraction-free.
- Mobile-first; good on desktop web.
- Quick entry should take very few taps.
- Never force a user to fill every reflection field.
- Autosave drafts with visible save/sync state.
- Show clear offline, pending, synced and conflict states.
- Support dark/light theme and accessible controls.
- Search by text, date, tags and mood.

## Future platform capabilities
- Versioned public-to-the-user API, not public unauthenticated data.
- OAuth scopes/permissions for connected apps.
- API keys or OAuth clients for future first-party projects, with revocation and audit trail.
- Webhooks/events can be added later; do not build a message bus in MVP.
- Stable resource IDs and API versioning.
- Export/import to avoid lock-in.
- Future AI assistant may create/search/summarize entries only with explicit user permission and transparent data handling.

## Explicit non-goals for initial release
- Social network or sharing feed.
- Multiple organizations/teams.
- Subscription or monetization system.
- Microservices.
- AI processing of diary content.
- Automatic Gmail ingestion.
- Google Photos library sync.
- Native-only features that break web support.
- Full task/project management suite.
