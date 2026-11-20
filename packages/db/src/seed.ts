import { createDbClient } from "./index.js";
import { entrySections, entryTags, journalEntries, tags, users } from "./schema.js";

async function seed() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://myday:myday_local_password@localhost:5432/myday";

  const { db, queryClient } = createDbClient(databaseUrl);

  try {
    console.log("🌱 Seeding database...");

    // 1. Insert seed user
    const [user] = await db
      .insert(users)
      .values({
        name: "Test User",
        email: "test@myday.local",
        timezone: "UTC",
      })
      .onConflictDoNothing()
      .returning();

    const userId = user?.id;

    if (userId) {
      // 2. Insert tags
      const [tag1] = await db
        .insert(tags)
        .values({
          userId,
          name: "Reflection",
          normalizedName: "reflection",
        })
        .onConflictDoNothing()
        .returning();

      // 3. Insert journal entry
      const [entry] = await db
        .insert(journalEntries)
        .values({
          userId,
          entryDate: "2026-11-20",
          title: "Initial Seed Reflection",
          body: "Seeded entry verifying PostgreSQL and Drizzle ORM persistence.",
          mood: 4,
          energy: 4,
          status: "published",
          isFavorite: true,
        })
        .onConflictDoNothing()
        .returning();

      if (entry) {
        // 4. Insert section
        await db.insert(entrySections).values({
          userId,
          entryId: entry.id,
          sectionType: "highlights",
          content: "PostgreSQL Drizzle schema successfully instantiated.",
        });

        if (tag1) {
          // 5. Insert entry_tag
          await db.insert(entryTags).values({
            entryId: entry.id,
            tagId: tag1.id,
          });
        }
      }
    }

    console.log("✅ Seed completed successfully!");
    await queryClient.end();
  } catch (err) {
    console.error("❌ Seed failed:", err);
    await queryClient.end();
    process.exit(1);
  }
}

seed();
