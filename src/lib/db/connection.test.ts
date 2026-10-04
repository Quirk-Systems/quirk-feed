import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "./connection";
import { readTimeline } from "./queries";
import { posts } from "./schema";

const directories: string[] = [];
function databasePath() {
  const directory = mkdtempSync(join(tmpdir(), "quirk-feed-db-test-"));
  directories.push(directory);
  return join(directory, "nested", "feed.db");
}
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe("database startup and timeline", () => {
  it("migrates a fresh database and preserves posts across reopening", () => {
    const filename = databasePath();
    const first = openDatabase(filename);
    first.db
      .insert(posts)
      .values({ author: "bry", body: "Keep this quirk" })
      .run();
    first.sqlite.close();
    const second = openDatabase(filename);
    try {
      expect(readTimeline(second.db)).toMatchObject([
        { author: "bry", body: "Keep this quirk" },
      ]);
      expect(second.sqlite.pragma("journal_mode", { simple: true })).toBe(
        "wal",
      );
    } finally {
      second.sqlite.close();
    }
  });

  it("reports missing migrations instead of swallowing initialization errors", () => {
    const filename = databasePath();
    expect(() => openDatabase(filename, join(filename, "missing"))).toThrow(
      "Could not initialize",
    );
    const repaired = openDatabase(filename);
    expect(readTimeline(repaired.db)).toEqual([]);
    repaired.sqlite.close();
  });

  it("refuses a corrupt database without overwriting it", () => {
    const filename = databasePath();
    const initialized = openDatabase(filename);
    initialized.sqlite.close();
    writeFileSync(filename, "not a SQLite database");
    expect(() => openDatabase(filename)).toThrow("Could not initialize");
  });

  it("shows the last inserted post first when timestamps share a second", () => {
    const connection = openDatabase(databasePath());
    try {
      const createdAt = new Date("2026-09-10T00:00:00Z");
      connection.db
        .insert(posts)
        .values([
          { id: "z-first", author: "bry", body: "first", createdAt },
          { id: "a-last", author: "bry", body: "last", createdAt },
        ])
        .run();
      expect(readTimeline(connection.db).map((post) => post.body)).toEqual([
        "last",
        "first",
      ]);
    } finally {
      connection.sqlite.close();
    }
  });

  it("bounds the timeline to the newest 100 posts", () => {
    const connection = openDatabase(databasePath());
    try {
      connection.db
        .insert(posts)
        .values(
          Array.from({ length: 101 }, (_, index) => ({
            author: "bry",
            body: `post ${index}`,
            createdAt: new Date(index * 1000),
          })),
        )
        .run();
      const timeline = readTimeline(connection.db);
      expect(timeline).toHaveLength(100);
      expect(timeline[0].body).toBe("post 100");
      expect(timeline[99].body).toBe("post 1");
    } finally {
      connection.sqlite.close();
    }
  });
});
