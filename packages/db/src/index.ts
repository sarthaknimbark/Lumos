import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export * from "./schema.js";

/**
 * Creates a typed Drizzle database instance from a connection URL
 */
export function createDbClient(databaseUrl: string) {
  const queryClient = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  const db = drizzle(queryClient, { schema });
  return { db, queryClient };
}

export type DbClient = ReturnType<typeof createDbClient>["db"];

/**
 * Checks database connectivity
 */
export async function checkDbConnection(databaseUrl: string): Promise<boolean> {
  const sql = postgres(databaseUrl, {
    max: 1,
    connect_timeout: 5,
  });
  try {
    const result = await sql`SELECT 1 as connected`;
    await sql.end();
    return result.length > 0;
  } catch {
    await sql.end({ timeout: 1 }).catch(() => {});
    return false;
  }
}
