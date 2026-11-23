# API Contract — `/api/v1`

All API inputs/outputs use shared Zod schemas in `packages/contracts`. Publish OpenAPI. Authenticated routes derive user identity from verified server context; never accept userId as authority from request body.

## System
- `GET /health` — process health
- `GET /ready` — DB readiness
- `GET /api/v1/openapi.json` — OpenAPI document

## Journal
- `GET /api/v1/entries?from=&to=&q=&tag=&mood=&cursor=`
- `POST /api/v1/entries`
- `GET /api/v1/entries/:id`
- `PATCH /api/v1/entries/:id` — requires base revision
- `DELETE /api/v1/entries/:id` — soft delete

Example create (supporting text, voice notes & photo attachments):
```json
{
  "entryDate": "2026-11-14",
  "title": "A day worth remembering",
  "body": "Markdown journal text (voice notes saved directly as audio files without speech-to-text transcription)",
  "mood": 4,
  "energy": 3,
  "status": "published",
  "sections": [
    {"type": "gratitude", "content": "A good conversation"},
    {"type": "highlights", "content": "Finished a project"}
  ],
  "tags": ["work", "personal"],
  "audioNotes": [
    {
      "id": "11111111-2222-3333-4444-555555555555",
      "url": "https://storage.myday.app/audio/clip_01.m4a",
      "durationSeconds": 102,
      "mimeType": "audio/m4a",
      "waveform": [12, 24, 45, 60, 32, 18, 55, 78, 20]
    }
  ],
  "photos": [
    {
      "id": "22222222-3333-4444-5555-666666666666",
      "url": "https://storage.myday.app/photos/img_01.jpg",
      "caption": "Sunset from the rooftop",
      "sizeBytes": 1420500,
      "mimeType": "image/jpeg"
    }
  ]
}
```

## Tags
- `GET /api/v1/tags`
- `POST /api/v1/tags`
- `PATCH /api/v1/tags/:id`
- `DELETE /api/v1/tags/:id`

## Search / export
- `GET /api/v1/search?q=&from=&to=&tags=`
- `GET /api/v1/export?format=json|markdown`
- `POST /api/v1/import/preview`
- `POST /api/v1/import/confirm`

## Integrations (later)
- `GET /api/v1/integrations`
- `POST /api/v1/integrations/drive/connect`
- `POST /api/v1/integrations/drive/backup`
- `POST /api/v1/integrations/drive/restore/preview`
- `POST /api/v1/integrations/drive/restore/confirm`
- `POST /api/v1/integrations/drive/disconnect`
- `POST /api/v1/integrations/calendar/connect`
- `GET /api/v1/integrations/calendar/events?date=YYYY-MM-DD`
- `POST /api/v1/integrations/calendar/disconnect`

## Sync (later)
- `POST /api/v1/sync/push`
- `GET /api/v1/sync/pull?since=`
Mutations carry operationId, entityId, operationType, baseRevision and payload. Operations must be idempotent. Return explicit conflict responses.

## Future external app access (not MVP)
Add OAuth authorization-code flow with PKCE for public clients, client credentials only for confidential server-to-server clients, narrow scopes, revocation and audit trail. Never ship client secrets in apps.

## Error shape
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted fields."
  }
}
```
Never expose stack traces, SQL errors, credentials or provider tokens.
