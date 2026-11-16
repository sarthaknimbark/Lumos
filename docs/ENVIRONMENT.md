# Environment Variables

Keep secrets in API-only environment variables. Never prefix secrets with `EXPO_PUBLIC_`.

## API
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://myday:LOCAL_PASSWORD@localhost:5432/myday
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APP_WEB_URL=http://localhost:8081
API_BASE_URL=http://localhost:4000
TOKEN_ENCRYPTION_KEY=
```

## Expo client
```env
EXPO_PUBLIC_API_URL=http://localhost:4000
```

On a physical phone, replace localhost with the computer's LAN IP for local development. In production, use HTTPS API URL.

## Neon
Use `DATABASE_URL` on the server only. Use provider-recommended pooled URL for runtime and direct URL for migrations if applicable. Do not commit real URLs.

## Google
Keep OAuth client secret on API. Drive/Calendar scopes and credentials are configured only in the phase that implements those integrations.
