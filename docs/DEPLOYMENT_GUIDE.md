# Production Deployment Guide — Web Service & Google Play Store

This guide details how to deploy the **MyDay Platform** into production:
1. **Part 1**: Deploying the backend API, Neon PostgreSQL database, and Web client.
2. **Part 2**: Building and publishing the native Android app to the **Google Play Store** via Expo Application Services (EAS).

---

# Part 1: Web Service Deployment (API + Database + Web Client)

## 1. Cloud Database (Neon PostgreSQL)

1. Sign up at [Neon](https://neon.tech) and create a project named `myday-production`.
2. Select a cloud region close to your target users (e.g., `us-east-1` or `eu-central-1`).
3. Neon provides two connection strings:
   * **Pooled Connection** (Recommended for runtime API traffic):
     `postgresql://user:password@ep-xyz-pooler.region.neon.tech/myday?sslmode=require`
   * **Direct Connection** (Required for running migrations):
     `postgresql://user:password@ep-xyz.region.neon.tech/myday?sslmode=require`
4. Set the pooled connection string as `DATABASE_URL` in your API hosting environment.

### Running Migrations in Production
Never run Drizzle schema push in production. Run compiled SQL migrations during your release pipeline or via CLI:
```bash
# Set your Neon direct connection string temporarily in your terminal
DATABASE_URL="postgresql://user:password@ep-xyz.region.neon.tech/myday?sslmode=require" pnpm db:migrate
```

---

## 2. Fastify API Web Service (e.g. Render, Railway, Fly.io, or VPS)

Choose a Node.js hosting platform (e.g. [Render](https://render.com), [Railway](https://railway.app), or a Linux VPS).

### Build & Start Commands
* **Build Command**: `pnpm install --frozen-lockfile && pnpm build:api`
* **Start Command**: `node apps/api/dist/index.js`
* **Health Check Path**: `/health`

### Production Environment Variables
Configure these in your host's Secret / Environment settings:

| Variable | Value Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Listening port (often provided by host) | `4000` |
| `DATABASE_URL` | Neon pooled PostgreSQL connection string | `postgresql://myday_owner:...@ep-pooler.neon.tech/myday?sslmode=require` |
| `AUTH_SECRET` | 32+ character random secret for signing tokens | Generate via `openssl rand -hex 32` |
| `API_BASE_URL` | Canonical HTTPS URL of your deployed API | `https://api.myday.yourdomain.com` |
| `APP_WEB_URL` | Canonical HTTPS URL of your Web client | `https://app.myday.yourdomain.com` |
| `GOOGLE_CLIENT_ID` | Production Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Production Google OAuth Client Secret | `GOCSPX-xxx` |
| `CORS_ORIGIN` | Allowed web origins (comma-separated) | `https://app.myday.yourdomain.com` |

---

## 3. Web Client Hosting (Vercel, Cloudflare Pages, or Netlify)

The universal Expo Router app exports static web assets:

1. **Build Command**:
   ```bash
   pnpm --filter @myday/client build:web
   # Generates output directory: apps/client/dist
   ```
2. **Publish Directory**: `apps/client/dist`
3. **Client Environment Variables**:
   * `EXPO_PUBLIC_API_URL`: `https://api.myday.yourdomain.com`
4. **Single Page App (SPA) Rewrites**:
   Configure redirect rules so all routes point to `/index.html` (e.g., in `vercel.json` or `_redirects` for Netlify/Cloudflare).

---

# Part 2: Android App Release to Google Play Store

We use **EAS Build** (Expo Application Services) to build signed Android App Bundles (`.aab`) and submit them to the Google Play Console.

---

## 1. Prerequisites for Google Play

1. **Google Play Console Developer Account**:
   * One-time \$25 registration fee at [play.google.com/console](https://play.google.com/console).
   * Complete identity verification.
   * *Note for personal accounts*: Google requires 20 testers enrolled in Closed Testing for at least 14 days before applying for production access.
2. **EAS CLI & Account**:
   * Create an account at [expo.dev](https://expo.dev).
   * Install CLI: `npm install -g eas-cli`
   * Log in: `eas login`

---

## 2. Configure `app.json` (Client App Metadata)

Ensure `apps/client/app.json` contains production identifiers:

```json
{
  "expo": {
    "name": "MyDay",
    "slug": "myday",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "myday",
    "userInterfaceStyle": "automatic",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourdomain.myday"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#121212"
      },
      "package": "com.yourdomain.myday",
      "versionCode": 1,
      "permissions": [
        "INTERNET"
      ]
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

---

## 3. Configure `eas.json` (Build Profiles)

In `apps/client/eas.json`:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.myday.yourdomain.com"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 4. Build Production Android App Bundle (`.aab`)

1. Initialize EAS in the client workspace:
   ```bash
   cd apps/client
   eas init
   ```
2. Trigger the production cloud build:
   ```bash
   eas build --platform android --profile production
   ```
3. EAS will ask: *“Generate a new Android Keystore?”* -> Select **Yes** (EAS securely manages signing keys and backups).
4. Download the generated `.aab` file from the build summary URL once completed.

---

## 5. Google Play Console Listing & Compliance

Before uploading your bundle, complete the required store listing sections:

### A. Store Assets
* **App Icon**: 512 × 512 px (PNG 32-bit with alpha).
* **Feature Graphic**: 1024 × 500 px (PNG or JPEG).
* **Phone Screenshots**: Minimum 2 screenshots (16:9 or 9:16 aspect ratio).
* **Short description**: Max 80 characters (e.g. *“Private daily journal and memory platform.”*).
* **Full description**: Clear explanation of core diary features and privacy model.

### B. App Content & Data Safety Declarations
Google Play strictly inspects data safety:
1. **Data Collection**:
   * Personal Info: Name, Email (for Google authentication).
   * App Activity: User-authored journal text and tags (stored securely and privately).
2. **Data Sharing**:
   * Declare **No data shared with third parties** (all user diary data is private and never sold or shared).
3. **Data Security**:
   * Data is encrypted in transit (HTTPS / TLS).
   * Users can request data deletion (provide account deletion workflow).
4. **Privacy Policy**:
   * Provide a public HTTPS URL explaining your data retention and privacy policies (e.g., hosted on your web client at `https://app.myday.yourdomain.com/privacy`).

---

## 6. Upload & Release Tracks

1. In Google Play Console, go to **Release** > **Testing** > **Internal testing**.
2. Click **Create new release** and upload the `.aab` file generated by EAS.
3. Add release notes (e.g. *“Initial internal release of MyDay.”*).
4. Save and rollout release to Internal Testers.
5. After internal verification, promote the release to:
   * **Closed Testing** (satisfy the 20-tester / 14-day criteria for personal developer accounts).
   * **Production Track** for review by the Google Play team.

---

## 7. Post-Launch Maintenance Checklist

- [ ] **Monitor Sentry / Error Logs** for production API and client crashes.
- [ ] **Track Database Performance** on Neon dashboard (connection pool saturation, query latency).
- [ ] **Automatic Backups**: Verify that user-initiated Google Drive JSON backups and database snapshot retention are active.
