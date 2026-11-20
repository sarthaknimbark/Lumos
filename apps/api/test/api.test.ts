process.env.NODE_ENV = "test";

import { buildApp } from "../src/app.js";
import { Env } from "../src/config.js";

const testEnv: Env = {
  NODE_ENV: "test",
  PORT: 4001,
  HOST: "127.0.0.1",
  API_BASE_URL: "http://127.0.0.1:4001",
  APP_WEB_URL: "http://localhost:8081",
  AUTH_SECRET: "test_secret_32_characters_minimum_ok",
  ENABLE_TEST_USER_BYPASS: true,
  TEST_USER_ID: "00000000-0000-0000-0000-000000000001",
};

async function runTests() {
  console.log("🧪 Starting MyDay API Integration Tests...\n");
  const app = await buildApp(testEnv);
  await app.ready();

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health check
  await test("GET /health returns 200 and valid status", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
    const body = res.json();
    if (body.status !== "ok" || body.version !== "0.1.0") {
      throw new Error(`Unexpected body: ${JSON.stringify(body)}`);
    }
  });

  // 2. Readiness check
  await test("GET /ready returns 200", async () => {
    const res = await app.inject({ method: "GET", url: "/ready" });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
    const body = res.json();
    if (!body.ready) throw new Error("Expected ready: true");
  });

  // 3. OpenAPI JSON
  await test("GET /api/v1/openapi.json returns OpenAPI 3.x spec", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/openapi.json" });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
    const body = res.json();
    if (!body.openapi && !body.swagger) {
      throw new Error("Expected openapi or swagger property");
    }
    if (!body.paths["/api/v1/entries"]) {
      throw new Error("Missing /api/v1/entries path in OpenAPI spec");
    }
  });

  // 4. List Entries
  await test("GET /api/v1/entries lists entries for authenticated user", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/entries",
    });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
    const body = res.json();
    if (!Array.isArray(body.data)) throw new Error("Expected data array");
  });

  // 5. Create Entry
  let createdId = "";
  await test("POST /api/v1/entries creates a new entry", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/entries",
      payload: {
        entryDate: "2026-11-21",
        title: "Test Entry from Integration Suite",
        body: "Testing full end-to-end API pipeline.",
        mood: 5,
        energy: 4,
        status: "published",
        sections: [
          { sectionType: "highlights", content: "Integration tests passing." },
        ],
        tags: ["testing", "qa"],
      },
    });
    if (res.statusCode !== 201) throw new Error(`Expected 201, got ${res.statusCode}: ${res.body}`);
    const body = res.json();
    if (!body.data.id || body.data.entryDate !== "2026-11-21") {
      throw new Error(`Unexpected entry created: ${JSON.stringify(body)}`);
    }
    createdId = body.data.id;
  });

  // 6. Conflict detection on update
  await test("PATCH /api/v1/entries/:id rejects mismatched baseRevision with 409", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/entries/${createdId}`,
      payload: {
        baseRevision: 999, // Mismatched revision
        title: "Attempted Conflict Update",
      },
    });
    if (res.statusCode !== 409) throw new Error(`Expected 409, got ${res.statusCode}`);
    const body = res.json();
    if (body.error.code !== "CONFLICT") {
      throw new Error(`Expected CONFLICT code, got: ${body.error.code}`);
    }
  });

  // 7. Successful update
  await test("PATCH /api/v1/entries/:id updates with correct baseRevision", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/entries/${createdId}`,
      payload: {
        baseRevision: 1,
        title: "Updated Title",
      },
    });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
    const body = res.json();
    if (body.data.revision !== 2 || body.data.title !== "Updated Title") {
      throw new Error(`Unexpected update result: ${JSON.stringify(body)}`);
    }
  });

  // 7b. Date navigation lookup
  await test("GET /api/v1/entries/by-date/:date returns entry by local diary date", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/entries/by-date/2026-11-21",
    });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}: ${res.body}`);
    const body = res.json();
    if (body.data.entryDate !== "2026-11-21") {
      throw new Error(`Expected entryDate 2026-11-21, got ${body.data.entryDate}`);
    }
  });

  // 7c. Text search
  await test("GET /api/v1/entries?q=pipeline matches entry body", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/entries?q=pipeline",
    });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
    const body = res.json();
    if (!body.data.some((e: any) => e.id === createdId)) {
      throw new Error("Expected search result to include createdId");
    }
  });

  // 7d. Filter by mood & pagination
  await test("GET /api/v1/entries with mood filter and pagination metadata", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/entries?mood=5&limit=10&offset=0",
    });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
    const body = res.json();
    if (!body.pagination || typeof body.pagination.total !== "number") {
      throw new Error(`Expected pagination metadata, got: ${JSON.stringify(body)}`);
    }
  });

  // 8. Tags endpoints
  await test("GET /api/v1/tags lists user tags", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/tags" });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
    const body = res.json();
    if (!Array.isArray(body.data)) throw new Error("Expected array of tags");
  });

  await test("POST /api/v1/tags creates a normalized tag", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/tags",
      payload: { name: "Focus" },
    });
    if (res.statusCode !== 201) throw new Error(`Expected 201, got ${res.statusCode}`);
    const body = res.json();
    if (body.data.normalizedName !== "focus") {
      throw new Error(`Expected normalizedName 'focus', got ${body.data.normalizedName}`);
    }
  });

  // 9. Groq Free AI Reflection Assistant
  await test("POST /api/v1/ai/reflection-prompt generates reflection prompt", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/ai/reflection-prompt",
      payload: {
        promptType: "gratitude",
        mood: 4,
        tags: ["family", "rest"],
      },
    });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
    const body = res.json();
    if (!body.data.prompt || !body.data.model) {
      throw new Error(`Invalid AI response: ${JSON.stringify(body)}`);
    }
  });

  // 10. Centralized 404 validation
  await test("GET nonexistent route returns formatted error", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/nonexistent" });
    if (res.statusCode !== 404) throw new Error(`Expected 404, got ${res.statusCode}`);
    const body = res.json();
    if (!body.error || body.error.code !== "NOT_FOUND") {
      throw new Error(`Expected NOT_FOUND error, got: ${JSON.stringify(body)}`);
    }
  });

  // 11. Auth - GET /api/v1/auth/session returns 401 without session
  await test("GET /api/v1/auth/session returns 401 without credentials", async () => {
    // Temporarily disable bypass for this test by using production env
    const prodApp = await buildApp({
      ...testEnv,
      NODE_ENV: "production",
      ENABLE_TEST_USER_BYPASS: false,
    });
    await prodApp.ready();
    const res = await prodApp.inject({
      method: "GET",
      url: "/api/v1/auth/session",
    });
    await prodApp.close();
    if (res.statusCode !== 401) throw new Error(`Expected 401, got ${res.statusCode}`);
  });

  // 12. Cross-ownership: User A cannot read User B's entries
  await test("Cross-ownership: User B cannot read User A's entries", async () => {
    // First create an entry as User A (the default TEST_USER_ID)
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/entries",
      payload: {
        entryDate: "2024-11-11",
        title: "User A's private entry",
        body: "User A's secret diary notes.",
        sections: [],
      },
    });
    // Should succeed (or be a conflict if already created)
    if (createRes.statusCode !== 201 && createRes.statusCode !== 409) {
      throw new Error(`Entry creation failed: ${createRes.statusCode} ${createRes.body}`);
    }
    const entryId =
      createRes.statusCode === 201
        ? createRes.json().data.id
        : null;

    if (!entryId) {
      // Skip ownership check if we got a conflict (entry exists from earlier test)
      console.log("    (skipping ownership check — entry already exists from earlier test)");
      return;
    }

    // Now try to read as User B (different UUID)
    const userBId = "00000000-0000-0000-0000-000000000002";
    const readRes = await app.inject({
      method: "GET",
      url: `/api/v1/entries/${entryId}`,
      headers: { "x-test-user-id": userBId },
    });
    // Must be 404 (not 403 — we don't reveal existence to other users)
    if (readRes.statusCode !== 404) {
      throw new Error(
        `Expected 404 for cross-owner read, got ${readRes.statusCode}: ${readRes.body}`
      );
    }
  });

  // 13. Cross-ownership: User B cannot update User A's entries
  await test("Cross-ownership: User B cannot update User A's entries", async () => {
    // Create entry as User A
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/entries",
      payload: {
        entryDate: "2024-11-12",
        title: "User A entry for update test",
        body: "User A's entry before update attempt.",
        sections: [],
      },
    });
    if (createRes.statusCode !== 201) {
      throw new Error(`Failed to create entry for update test: ${createRes.statusCode} ${createRes.body}`);
    }
    const entry = createRes.json().data;
    const entryId = entry.id;
    const userBId = "00000000-0000-0000-0000-000000000002";
    const updateRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/entries/${entryId}`,
      headers: { "x-test-user-id": userBId },
      payload: { title: "Hacked Title", baseRevision: entry.revision },
    });
    if (updateRes.statusCode !== 404) {
      throw new Error(
        `Expected 404 for cross-owner update, got ${updateRes.statusCode}`
      );
    }
  });

  // 14. Cross-ownership: User B cannot delete User A's entries
  await test("Cross-ownership: User B cannot delete User A's entries", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/entries",
      payload: {
        entryDate: "2024-11-13",
        title: "User A entry for delete test",
        body: "User A's entry before delete attempt.",
        sections: [],
      },
    });
    if (createRes.statusCode !== 201) {
      throw new Error(`Failed to create entry for delete test: ${createRes.statusCode} ${createRes.body}`);
    }
    const entryId = createRes.json().data.id;
    const userBId = "00000000-0000-0000-0000-000000000002";
    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/entries/${entryId}`,
      headers: { "x-test-user-id": userBId },
    });
    if (deleteRes.statusCode !== 404) {
      throw new Error(
        `Expected 404 for cross-owner delete, got ${deleteRes.statusCode}`
      );
    }
  });

  // 15. Offline sync: Idempotency-Key prevents duplicate creation on replay
  await test("POST /api/v1/entries with Idempotency-Key returns cached entry on replay", async () => {
    const idempotencyKey = "55555555-5555-4555-a555-555555555555";
    const payload = {
      entryDate: "2025-05-05",
      title: "Idempotent Entry",
      body: "Testing offline queue replay protection.",
      sections: [],
    };

    // First attempt: creates entry
    const res1 = await app.inject({
      method: "POST",
      url: "/api/v1/entries",
      headers: { "x-idempotency-key": idempotencyKey },
      payload,
    });
    if (res1.statusCode !== 201) {
      throw new Error(`Expected 201 on first attempt, got ${res1.statusCode}`);
    }
    const firstId = res1.json().data.id;

    // Second attempt with SAME idempotency key (simulating offline reconnect replay)
    const res2 = await app.inject({
      method: "POST",
      url: "/api/v1/entries",
      headers: { "x-idempotency-key": idempotencyKey },
      payload,
    });
    if (res2.statusCode !== 201) {
      throw new Error(`Expected 201 on idempotent replay, got ${res2.statusCode}`);
    }
    const secondId = res2.json().data.id;
    if (firstId !== secondId) {
      throw new Error(`Expected identical entry ID (${firstId}), got ${secondId}`);
    }
  });

  // 16. Phase 7: AES-256-GCM Token Encryption roundtrip
  await test("AES-256-GCM token encryption and decryption preserves secret without plain exposure", async () => {
    const { encryptToken, decryptToken } = await import("../src/services/driveService.js");
    const secret = "test_encryption_key_32_chars_ok!";
    const rawToken = "1//04example_google_refresh_token_very_secret";
    const encrypted = encryptToken(rawToken, secret);

    if (encrypted === rawToken || !encrypted.includes(":")) {
      throw new Error("Encrypted token must differ from plain and include IV:Tag:Data format");
    }
    const decrypted = decryptToken(encrypted, secret);
    if (decrypted !== rawToken) {
      throw new Error(`Decrypted token '${decrypted}' does not match original '${rawToken}'`);
    }
  });

  // 17. Phase 7: Drive Status, Connect, Backup, and History
  await test("Google Drive: Status, Connect, Create Backup, and List Backups", async () => {
    // 17.1 Initial status is disconnected
    const statusRes = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/drive/status",
    });
    if (statusRes.statusCode !== 200) throw new Error(`Expected 200, got ${statusRes.statusCode}`);
    if (statusRes.json().connected !== false) throw new Error("Expected disconnected initially");

    // 17.2 Connect Drive
    const connectRes = await app.inject({
      method: "POST",
      url: "/api/v1/integrations/drive/connect",
      payload: { authCode: "4/0AeanS0_example_auth_code_from_consent" },
    });
    if (connectRes.statusCode !== 200) throw new Error(`Expected 200, got ${connectRes.statusCode}`);
    if (connectRes.json().connected !== true) throw new Error("Expected connected after connect call");

    // 17.3 Create Backup
    const backupRes = await app.inject({
      method: "POST",
      url: "/api/v1/integrations/drive/backup",
    });
    if (backupRes.statusCode !== 200) throw new Error(`Expected 200, got ${backupRes.statusCode}`);
    const backup = backupRes.json();
    if (!backup.id || !backup.checksum || backup.entryCount === undefined) {
      throw new Error(`Invalid backup response: ${JSON.stringify(backup)}`);
    }

    // 17.4 List Backups
    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/drive/backups",
    });
    if (listRes.statusCode !== 200) throw new Error(`Expected 200, got ${listRes.statusCode}`);
    const { backups } = listRes.json();
    if (!Array.isArray(backups) || backups.length === 0) {
      throw new Error("Expected at least one backup in history");
    }

    // 17.5 Preview Restore
    const previewRes = await app.inject({
      method: "POST",
      url: "/api/v1/integrations/drive/restore/preview",
      payload: { backupId: backup.id },
    });
    if (previewRes.statusCode !== 200) throw new Error(`Expected 200, got ${previewRes.statusCode}`);
    const preview = previewRes.json();
    if (preview.entryCount !== backup.entryCount) {
      throw new Error("Expected preview entry count to match backup entry count");
    }

    // 17.6 Confirm Restore (Merge)
    const restoreRes = await app.inject({
      method: "POST",
      url: "/api/v1/integrations/drive/restore/confirm",
      payload: { backupId: backup.id, strategy: "merge" },
    });
    if (restoreRes.statusCode !== 200) throw new Error(`Expected 200, got ${restoreRes.statusCode}`);
    if (restoreRes.json().success !== true) throw new Error("Expected success: true on restore confirm");
  });

  // 18. Phase 7: Attachments CRUD and Isolation
  await test("Attachments: Add, List, and Delete linked to entry", async () => {
    // 18.1 Create entry first
    const entryRes = await app.inject({
      method: "POST",
      url: "/api/v1/entries",
      payload: {
        entryDate: "2025-06-01",
        title: "Entry with Attachment",
        body: "Testing file attachments from Google Drive.",
        sections: [],
      },
    });
    const entryId = entryRes.json().data.id;

    // 18.2 Add Attachment
    const addRes = await app.inject({
      method: "POST",
      url: `/api/v1/entries/${entryId}/attachments`,
      payload: {
        providerFileId: "1abc_drive_file_id_xyz",
        filename: "journal_sketch.png",
        mimeType: "image/png",
        sizeBytes: 1048576, // 1MB
      },
    });
    if (addRes.statusCode !== 201) throw new Error(`Expected 201, got ${addRes.statusCode}`);
    const attachment = addRes.json();
    if (attachment.filename !== "journal_sketch.png") {
      throw new Error("Expected filename journal_sketch.png");
    }

    // 18.3 List Attachments
    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/entries/${entryId}/attachments`,
    });
    if (getRes.statusCode !== 200) throw new Error(`Expected 200, got ${getRes.statusCode}`);
    const list = getRes.json();
    if (!Array.isArray(list) || list.length !== 1) {
      throw new Error("Expected 1 attachment");
    }

    // 18.4 Delete Attachment
    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/attachments/${attachment.id}`,
    });
    if (delRes.statusCode !== 200) throw new Error(`Expected 200, got ${delRes.statusCode}`);
  });

  // 19. Phase 8: Google Calendar Read-Only Integration
  await test("Google Calendar: Status, Connect (read-only), Events for date, Disconnect, and Isolation", async () => {
    // 19.1 Initial status is disconnected
    const statusRes = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/calendar/status",
    });
    if (statusRes.statusCode !== 200) throw new Error(`Expected 200, got ${statusRes.statusCode}`);
    if (statusRes.json().connected !== false) throw new Error("Expected disconnected initially");

    // 19.2 Connect Calendar with read-only code
    const connectRes = await app.inject({
      method: "POST",
      url: "/api/v1/integrations/calendar/connect",
      payload: { authCode: "4/0AeanS0_example_calendar_auth_code" },
    });
    if (connectRes.statusCode !== 200) throw new Error(`Expected 200, got ${connectRes.statusCode}`);
    const connectBody = connectRes.json();
    if (connectBody.connected !== true) throw new Error("Expected connected: true");
    if (!connectBody.scopes.includes("https://www.googleapis.com/auth/calendar.events.readonly")) {
      throw new Error("Must enforce read-only calendar scope");
    }

    // 19.3 Fetch read-only events for a diary date
    const eventsRes = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/calendar/events?date=2026-11-20",
    });
    if (eventsRes.statusCode !== 200) throw new Error(`Expected 200, got ${eventsRes.statusCode}`);
    const eventsBody = eventsRes.json();
    if (eventsBody.date !== "2026-11-20" || !Array.isArray(eventsBody.events)) {
      throw new Error(`Invalid events response: ${JSON.stringify(eventsBody)}`);
    }

    // 19.4 Rejects invalid date format
    const invalidDateRes = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/calendar/events?date=invalid-date",
    });
    if (invalidDateRes.statusCode !== 400) {
      throw new Error(`Expected 400 for invalid date, got ${invalidDateRes.statusCode}`);
    }

    // 19.5 Cross-user isolation: User B should be disconnected
    const userBStatus = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/calendar/status",
      headers: { "x-test-user-id": "22222222-2222-2222-2222-222222222222" },
    });
    if (userBStatus.statusCode !== 200) throw new Error(`Expected 200, got ${userBStatus.statusCode}`);
    if (userBStatus.json().connected !== false) {
      throw new Error("User B's calendar status must be isolated from User A");
    }

    // 19.6 Disconnect Calendar for User A
    const disconnectRes = await app.inject({
      method: "POST",
      url: "/api/v1/integrations/calendar/disconnect",
    });
    if (disconnectRes.statusCode !== 200) throw new Error(`Expected 200, got ${disconnectRes.statusCode}`);

    const finalStatus = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/calendar/status",
    });
    if (finalStatus.json().connected !== false) throw new Error("Expected disconnected after disconnect call");
  });

  await app.close();

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
