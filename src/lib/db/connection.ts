import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema.ts";

export function databaseFilename() {
  const filename = process.env.DATABASE_URL ?? "local.db";
  if (!filename.trim())
    throw new Error("DATABASE_URL must be a SQLite file path.");
  return filename;
}

/** Open and migrate once. A failed migration must never masquerade as success. */
export function openDatabase(
  filename = databaseFilename(),
  migrationsFolder = resolve("drizzle"),
) {
  if (filename !== ":memory:") {
    mkdirSync(dirname(resolve(filename)), { recursive: true });
  }
  const sqlite = new Database(filename, { timeout: 5000 });
  try {
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder });
    return { db, sqlite };
  } catch (cause) {
    sqlite.close();
    throw new Error(
      "Could not initialize the feed database. Check the database path and committed migrations.",
      { cause },
    );
  }
}
