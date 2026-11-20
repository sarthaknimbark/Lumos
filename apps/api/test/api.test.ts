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

  await app.close();

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
