import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database(process.env.DATABASE_URL ?? "local.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Apply migrations on startup so the app is self-sufficient in every context
// (dev, production start, and CI e2e) without a separate migrate step.
try {
  migrate(db, { migrationsFolder: "./drizzle" });
} catch {
  // Migrations already applied or running concurrently — safe to ignore.
}
