# System Requirements & Manual Setup Checklist

This document provides a complete checklist of prerequisites, tool verification commands, manual third-party service setup, and local network configuration for developing the **MyDay Platform**.

---

## 1. System Requirements & Prerequisites

Ensure the following tools are installed on your development machine:

| Tool | Recommended Version | Purpose | Check Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | **v20 LTS** or **v22 LTS** *(avoid v24 for RN/Metro stability)* | Runtime for Fastify API & Expo tooling | `node -v` |
| **pnpm** | `v9.x` or `v10.x` | Monorepo workspace package manager | `pnpm -v` |
| **Git** | `v2.40+` | Version control | `git --version` |
| **Docker Desktop** | Latest (WSL2 engine on Windows) | Runs local PostgreSQL 16 container | `docker --version` |
| **Java JDK** | **JDK 17 LTS** | Android build system (Gradle) | `javac -version` |
| **Android Studio** | Latest | Android SDK (`platforms`, `build-tools`, emulator) | `adb --version` |
| **Expo CLI / EAS CLI** | Latest | Client development & cloud builds | `npx eas-cli --version` |

> [!IMPORTANT]
> **Node.js LTS Advisory**: Your machine currently has Node `v24.12.0`. React Native Metro bundler and Gradle build plugins can experience unexpected issues on Node 24. It is strongly recommended to install and switch to **Node 20 or 22 LTS** using `nvm-windows` or `fnm`:
> ```powershell
> # If using nvm-windows:
> nvm install 22.13.0
> nvm use 22.13.0
> ```

---

## 2. One-Click System Verification Script

Run this PowerShell command in your terminal to verify your development environment in one step:

```powershell
Write-Host "=== MyDay Environment Check ===" -ForegroundColor Cyan
$tools = @(
  @{ Name = "Node.js"; Cmd = "node -v" },
  @{ Name = "pnpm"; Cmd = "pnpm -v" },
  @{ Name = "Git"; Cmd = "git --version" },
  @{ Name = "Docker"; Cmd = "docker --version" },
  @{ Name = "Java"; Cmd = "javac -version" },
  @{ Name = "ADB"; Cmd = "adb --version" }
)

foreach ($t in $tools) {
  try {
    $ver = Invoke-Expression $t.Cmd 2>&1 | Select-Object -First 1
    Write-Host "✅ $($t.Name): $ver" -ForegroundColor Green
  } catch {
    Write-Host "❌ $($t.Name): NOT FOUND" -ForegroundColor Red
  }
}
```

---

## 3. Manual Setup Checklist (Step-by-Step)

Follow these manual steps before or during each phase:

### Step A: Start Local PostgreSQL (Docker)
1. Ensure Docker Desktop is running.
2. From the repository root, start the local database container:
   ```powershell
   docker compose up -d db
   ```
3. Check container status:
   ```powershell
   docker compose ps
   ```
   *Port `5432` will be bound locally.*

### Step B: Create Local Environment Files (`.env`)
Create two local environment files (do **never** commit `.env` files to git):

1. **`apps/api/.env`** (Backend secrets):
   ```env
   NODE_ENV=development
   PORT=4000
   DATABASE_URL=postgresql://myday:myday_local_password@localhost:5432/myday
   AUTH_SECRET=generate_a_random_32_character_string_here
   API_BASE_URL=http://localhost:4000
   APP_WEB_URL=http://localhost:8081
   GOOGLE_CLIENT_ID=your_dev_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_dev_google_client_secret
   ```

2. **`apps/client/.env`** (Expo client public variables):
   ```env
   # Use localhost for web, or your PC's LAN IP for Android testing (see Step D)
   EXPO_PUBLIC_API_URL=http://localhost:4000
   ```

### Step C: Google Cloud Console Setup (OAuth Identity)
*(Required when implementing Phase 4 — Auth)*

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project: `MyDay Platform (Dev)`.
3. Go to **APIs & Services** > **OAuth consent screen**:
   * User Type: **External**.
   * App name: `MyDay`.
   * Add your email under **Test users** while the app is in Testing mode.
   * Scopes: Select only `openid`, `email`, `profile`. *(Do NOT add Drive or Calendar scopes here; they are requested separately in later phases).*
4. Go to **Credentials** > **Create Credentials** > **OAuth Client ID**:
   * **Web application client** (for Web & Better Auth backend callback):
     * Authorized JavaScript origins: `http://localhost:8081`, `http://localhost:4000`
     * Authorized redirect URIs: `http://localhost:4000/api/auth/callback/google`
   * **Android / Native client** (for Expo custom URI scheme):
     * Package name: `com.myday.app`
     * SHA-1 fingerprint: Obtain from `npx eas credentials` or local debug keystore.
5. Copy `Client ID` and `Client Secret` into `apps/api/.env`.

---

## 4. Local Device & Emulator Testing Setup

### Testing on Android Emulator
1. Launch Android Studio > **Virtual Device Manager**.
2. Start an AVD running Android 14 or 15 (Google Play system image).
3. Reverse the Fastify API port so `localhost:4000` inside the emulator routes to your PC:
   ```powershell
   adb reverse tcp:4000 tcp:4000
   ```

### Testing on Physical Android Phone (Expo Go)
1. Install **Expo Go** from Google Play Store on your device.
2. Connect your phone and PC to the **same Wi-Fi network**.
3. Find your PC's local IP address:
   ```powershell
   ipconfig
   # Look for IPv4 Address under Wireless LAN adapter (e.g. 192.168.1.15)
   ```
4. Set `apps/client/.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.15:4000
   ```
5. **Windows Firewall Rule**: Ensure Windows Defender allows incoming connections to Node.js / Port 4000 from Private networks.

---

## 5. Development Routine Commands

Once the workspace is scaffolded:

```powershell
# 1. Install dependencies
pnpm install

# 2. Run local database migrations
pnpm db:migrate

# 3. Start development servers in parallel:
pnpm dev:api      # Fastify API at http://localhost:4000
pnpm dev:client   # Expo Metro at http://localhost:8081
```
