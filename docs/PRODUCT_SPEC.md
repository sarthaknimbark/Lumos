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
1. Google sign-in and email/password authentication.
2. Today dashboard with Dual-Mode entry creation:
   - **Type Mode**: Focused editorial text writing with headline, body, and reflection sections.
   - **Record Mode**: Studio-grade audio recorder that saves the raw voice recording file for playback and waveform scrub (strictly zero speech-to-text transcription for complete privacy).
3. In-line Photo & Image Attachments: Add pictures to reflections with multi-photo bento grid, lightbox viewer, and captions.
4. One primary diary entry per local date (schema supports revision-based concurrency).
5. Mood and energy rating (zero colored emojis; theme-matched outline vector icons that fill solid with theme accents when selected).
6. Structured reflection sections: highlights, gratitude, learned, tomorrow.
7. Tags, favorites and search.
8. Calendar and timeline feed with audio note waveforms and photo thumbnails.
9. JSON/Markdown export and validated import preview.
10. Offline drafts and sync (IndexedDB on web, SecureStore on native).
11. Optional Google Drive backup (isolated AppData scope).
12. Optional read-only Google Calendar context.

## UX principles
- Calm, minimal, private, fast and distraction-free.
- **High-Craft Bespoke Luxury Aesthetics**: Pure OLED pitch slate background (`#08090c`), titanium dark surfaces (`#11131a`), hairline borders (`rgba(255,255,255,0.08)`), and precision iris accent (`#6366f1`). No generic AI pastel colors.
- **Zero Colored Emojis**: All emotional and status indicators use minimalist 2px monochrome outline vector icons that fill solid with curated theme tones (Amber, Emerald, Sky, Rose) only upon selection.
- **Dual-Mode Fluidity**: Immediate choice between typing and voice recording on entry creation, with photos attachable in both modes.
- Responsive adaptation: Touch-first bottom bar on mobile (<768px); left sidebar rail and dual-column bento grid on desktop web (≥768px).
- Quick entry should take very few taps.
- Never force a user to fill every reflection field.
- Autosave drafts with visible save/sync state.
- Show clear offline, pending, synced and conflict states.
- Search by text, date, tags, media type (audio/photo), and mood.

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
