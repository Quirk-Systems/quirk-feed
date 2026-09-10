import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
