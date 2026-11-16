# Security, Privacy and Integration Rules

## User data
- Every private record belongs to a user.
- Every query and mutation enforces authenticated user ownership.
- Never trust client-supplied userId.
- Test cross-account access for read/update/delete/search/export.
- Database credentials exist only in API runtime.

## Authentication
- Verify current Better Auth Expo integration and Fastify hosting pattern before implementation.
- Web sessions use secure HTTP-only cookies where supported.
- Native session tokens use platform secure storage; never AsyncStorage for sensitive long-lived tokens.
- Google identity sign-in requests minimum identity scopes.
- Drive and Calendar consent are independent.
- Implement logout, session revocation and account deletion.

## Future app integrations
- Use OAuth 2.0 authorization code + PKCE for public native/web clients.
- Use client credentials only for confidential server-side apps.
- Define scopes such as `journal:read`, `journal:write`, `profile:read`.
- Tokens must be short-lived, revocable and scoped.
- Never embed client secrets in mobile apps or browser bundles.
- Add integration grant screen, revoke button and audit events before external integrations go live.
- Do not expose raw PostgreSQL credentials to future projects.

## Secrets and deployment
- `.env` files are gitignored; `.env.example` contains placeholders only.
- No secret with `EXPO_PUBLIC_` prefix.
- Encrypt provider refresh tokens at rest if persisted.
- Do not log journal content or tokens.
- HTTPS, CORS allowlist, rate limiting and request validation required.
- Use parameterized ORM queries.

## Privacy
- No AI processing or third-party diary content transfer by default.
- Explain storage/provider behavior and backup limitations.
- Export data to JSON/Markdown.
- Deletion workflow must remove owned records and integration tokens.
- Do not claim end-to-end encryption unless designed, implemented and audited.

## Files
- Validate MIME, extension and size server-side.
- Keep Drive files private by default.
- Store provider IDs, not expiring public URLs.
- Validate backup version, checksum and size before restore.

## Offline
- Avoid caching authenticated API responses in shared service worker caches.
- Provide local logout/data-clear behavior.
- Preserve both sides of sync conflicts; never silently overwrite.
