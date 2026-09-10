import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import Database from "better-sqlite3";
import { expect, it } from "vitest";

it("diagnoses without creating a database and backs up committed WAL data without overwrites", () => {
  const directory = mkdtempSync(join(tmpdir(), "quirk-feed-cli-test-"));
  const filename = join(directory, "feed.db");
  const target = join(directory, "backup.db");
  function command(...args: string[]) {
    return spawnSync(process.execPath, ["scripts/database.ts", ...args], {
      env: { ...process.env, DATABASE_URL: filename, NODE_ENV: "test" },
      encoding: "utf8",
      timeout: 15_000,
    });
  }
  try {
    expect(command("doctor").status).toBe(1);
    expect(existsSync(filename)).toBe(false);
    const migrate = command("migrate");
    expect(migrate.status, migrate.stderr).toBe(0);
    const report = command("doctor");
    expect(report.status, report.stderr).toBe(0);
    expect(JSON.parse(report.stdout)).toMatchObject({
      ok: true,
      next: "16.3.4",
      integrity: "ok",
    });
    const writer = new Database(filename);
    try {
      writer.pragma("journal_mode = WAL");
      writer
        .prepare("INSERT INTO posts VALUES (?, ?, ?, ?)")
        .run("saved", "bry", "WAL survives", 123);
      const backup = command("backup", "--", target);
      expect(backup.status, backup.stderr).toBe(0);
      const restored = new Database(target, {
        readonly: true,
        fileMustExist: true,
      });
      try {
        expect(restored.prepare("SELECT body FROM posts").get()).toEqual({
          body: "WAL survives",
        });
      } finally {
        restored.close();
      }
      const before = readFileSync(target);
      expect(command("backup", target).status).toBe(1);
      expect(readFileSync(target)).toEqual(before);
      expect(command("backup", filename).status).toBe(1);
      expect(command("backup").status).toBe(1);
    } finally {
      writer.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

it("rejects a schema without the rowid required by the timeline", () => {
  const directory = mkdtempSync(join(tmpdir(), "quirk-feed-doctor-schema-"));
  const filename = join(directory, "feed.db");
  const writer = new Database(filename);
  try {
    writer.exec(`
      CREATE TABLE posts (
        id TEXT PRIMARY KEY NOT NULL,
        author TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL
      ) WITHOUT ROWID;
      INSERT INTO posts VALUES ('saved', 'bry', 'keep me', 123);
    `);
  } finally {
    writer.close();
  }
  try {
    const before = readFileSync(filename);
    const result = spawnSync(
      process.execPath,
      ["scripts/database.ts", "doctor"],
      {
        env: { ...process.env, DATABASE_URL: filename, NODE_ENV: "test" },
        encoding: "utf8",
        timeout: 15_000,
      },
    );
    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toContain("rowid");
    expect(result.stdout).not.toContain('"ok": true');
    expect(readFileSync(filename)).toEqual(before);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

it("rejects a corrupt completed backup before publication and cleans up staging", () => {
  const directory = mkdtempSync(join(tmpdir(), "quirk-feed-backup-corrupt-"));
  const filename = join(directory, "feed.db");
  const target = join(directory, "backup.db");
  const preload = join(directory, "corrupt-backup.mjs");
  const writer = new Database(filename);
  try {
    writer.exec(
      "CREATE TABLE fixture (body TEXT); INSERT INTO fixture VALUES ('keep me');",
    );
    const before = readFileSync(filename);
    writeFileSync(
      preload,
      `
      import { closeSync, openSync, writeSync } from "node:fs";
      import Database from ${JSON.stringify(pathToFileURL(resolve("node_modules/better-sqlite3/lib/index.js")).href)};
      const backup = Database.prototype.backup;
      Database.prototype.backup = async function (destination, options) {
        const result = await backup.call(this, destination, options);
        // Corrupt the completed copy, exercising verification after native transfer.
        const descriptor = openSync(destination, "r+");
        try {
          writeSync(descriptor, Buffer.from("broken SQLite header"), 0, 20, 0);
        } finally {
          closeSync(descriptor);
        }
        return result;
      };
    `,
    );
    const result = spawnSync(
      process.execPath,
      ["--import", preload, "scripts/database.ts", "backup", target],
      {
        env: { ...process.env, DATABASE_URL: filename, NODE_ENV: "test" },
        encoding: "utf8",
        timeout: 15_000,
      },
    );
    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toContain("Backup integrity check failed");
    expect(existsSync(target)).toBe(false);
    expect(result.stdout).not.toContain("Database backup saved");
    expect(
      readdirSync(directory).some((name) =>
        name.startsWith(".quirk-feed-backup-"),
      ),
    ).toBe(false);
    expect(readFileSync(filename)).toEqual(before);
    expect(writer.prepare("SELECT body FROM fixture").get()).toEqual({
      body: "keep me",
    });
  } finally {
    writer.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

it("does not publish an incomplete backup when the process is killed during transfer", () => {
  const directory = mkdtempSync(join(tmpdir(), "quirk-feed-backup-interrupt-"));
  const filename = join(directory, "feed.db");
  const target = join(directory, "backup.db");
  const preload = join(directory, "interrupt.mjs");
  const writer = new Database(filename);
  try {
    writer.exec(
      "CREATE TABLE fixture (body TEXT); INSERT INTO fixture VALUES ('keep me');",
    );
    // Exercise the real native transfer, then kill the CLI before it completes.
    writeFileSync(
      preload,
      `
      import Database from ${JSON.stringify(pathToFileURL(resolve("node_modules/better-sqlite3/lib/index.js")).href)};
      const backup = Database.prototype.backup;
      Database.prototype.backup = function (destination, options) {
        return backup.call(this, destination, {
          ...options,
          progress() { process.kill(process.pid, "SIGKILL"); return 0; },
        });
      };
    `,
    );
    const result = spawnSync(
      process.execPath,
      ["--import", preload, "scripts/database.ts", "backup", target],
      {
        env: { ...process.env, DATABASE_URL: filename, NODE_ENV: "test" },
        encoding: "utf8",
        timeout: 15_000,
      },
    );
    expect(result.signal, result.stderr).toBe("SIGKILL");
    expect(existsSync(target)).toBe(false);
    expect(result.stdout).not.toContain("Database backup saved");
    expect(writer.prepare("SELECT body FROM fixture").get()).toEqual({
      body: "keep me",
    });
  } finally {
    writer.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

it("preserves a destination created by another writer during the backup", () => {
  const directory = mkdtempSync(join(tmpdir(), "quirk-feed-backup-race-"));
  const filename = join(directory, "feed.db");
  const target = join(directory, "backup.db");
  const preload = join(directory, "competing-writer.mjs");
  const writer = new Database(filename);
  try {
    writer.exec(
      "CREATE TABLE fixture (body TEXT); INSERT INTO fixture VALUES ('keep me');",
    );
    writeFileSync(
      preload,
      `
      import { writeFileSync } from "node:fs";
      import Database from ${JSON.stringify(pathToFileURL(resolve("node_modules/better-sqlite3/lib/index.js")).href)};
      const backup = Database.prototype.backup;
      Database.prototype.backup = function (destination, options) {
        let claimed = false;
        return backup.call(this, destination, {
          ...options,
          progress() {
            if (!claimed) {
              claimed = true;
              writeFileSync(process.env.QUIRK_BACKUP_TARGET, "another writer's file", { flag: "wx" });
            }
          },
        });
      };
    `,
    );
    const result = spawnSync(
      process.execPath,
      ["--import", preload, "scripts/database.ts", "backup", target],
      {
        env: {
          ...process.env,
          DATABASE_URL: filename,
          QUIRK_BACKUP_TARGET: target,
          NODE_ENV: "test",
        },
        encoding: "utf8",
        timeout: 15_000,
      },
    );
    expect(result.status, result.stderr).toBe(1);
    expect(existsSync(target)).toBe(true);
    expect(readFileSync(target, "utf8")).toBe("another writer's file");
    expect(result.stdout).not.toContain("Database backup saved");
  } finally {
    writer.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
