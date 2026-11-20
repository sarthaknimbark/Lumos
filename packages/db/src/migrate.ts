import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import postgres from "postgres";

async function runMigrations() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://myday:myday_local_password@localhost:5432/myday";

  console.log("Running migrations against database...");
  const migrationClient = postgres(databaseUrl, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    const migrationsFolder = path.resolve(__dirname, "../drizzle");
    await migrate(db, { migrationsFolder });
    console.log("✅ Migrations applied successfully!");
    await migrationClient.end();
  } catch (err) {
    console.error("❌ Migration failed:", err);
    await migrationClient.end();
    process.exit(1);
  }
}

runMigrations();
