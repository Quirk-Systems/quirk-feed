import { closeSync, existsSync, openSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import Database from "better-sqlite3";
import { databaseFilename, openDatabase } from "../src/lib/db/connection.ts";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const require = createRequire(import.meta.url);
const command = process.argv[2];

async function main() {
  if (command === "migrate") {
    const { sqlite } = openDatabase();
    sqlite.close();
    console.log("Database migrations applied.");
    return;
  }
  if (command !== "doctor" && command !== "backup") {
    throw new Error(
      "Usage: bun run doctor | bun run db:migrate | bun run db:backup <new-backup.db>",
    );
  }
  const filename = resolve(databaseFilename());
  if (!existsSync(filename)) {
    throw new Error(
      "Database does not exist. Run bun run db:migrate or start the app first.",
    );
  }
  const sqlite = new Database(filename, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    if (command === "doctor") {
      const integrity = sqlite.pragma("quick_check", { simple: true });
      sqlite
        .prepare("SELECT id, author, body, created_at FROM posts LIMIT 0")
        .all();
      if (integrity !== "ok") throw new Error("SQLite integrity check failed.");
      console.log(
        JSON.stringify(
          {
            ok: true,
            node: process.version,
            next: require("next/package.json").version,
            react: require("react/package.json").version,
            database: filename,
            integrity,
            journalMode: sqlite.pragma("journal_mode", { simple: true }),
          },
          null,
          2,
        ),
      );
      return;
    }
    const destination =
      process.argv[3] === "--" ? process.argv[4] : process.argv[3];
    if (!destination)
      throw new Error(
        "Supply a new backup filename: bun run db:backup backups/feed.db",
      );
    const target = resolve(destination);
    // Refuse overwrites, including an accidental backup onto the source database.
    closeSync(openSync(target, "wx", 0o600));
    try {
      await sqlite.backup(target);
    } catch (error) {
      rmSync(target, { force: true });
      throw error;
    }
    console.log(`Database backup saved to ${target}`);
  } finally {
    sqlite.close();
  }
}

try {
  await main();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Database command failed.",
  );
  process.exitCode = 1;
}
