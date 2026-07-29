import { describe, it, expect } from "vitest";
import { validatePost, sortByNewest, relativeTime, MAX_BODY } from "./feed";

describe("validatePost", () => {
  it("accepts a normal post and trims whitespace", () => {
    const result = validatePost({ author: "  bry  ", body: "  hello world  " });
    expect(result).toEqual({
      ok: true,
      value: { author: "bry", body: "hello world" },
    });
  });

  it("defaults a blank author to anon", () => {
    const result = validatePost({ author: "   ", body: "yo" });
    expect(result.ok && result.value.author).toBe("anon");
  });

  it("rejects an empty body", () => {
    const result = validatePost({ body: "   " });
    expect(result.ok).toBe(false);
  });

  it("rejects a body over the limit", () => {
    const result = validatePost({ body: "x".repeat(MAX_BODY + 1) });
    expect(result.ok).toBe(false);
  });

  it("accepts a body exactly at the limit", () => {
    const result = validatePost({ body: "x".repeat(MAX_BODY) });
    expect(result.ok).toBe(true);
  });

  it("rejects an over-long author", () => {
    const result = validatePost({ author: "x".repeat(41), body: "hi" });
    expect(result.ok).toBe(false);
  });
});

describe("sortByNewest", () => {
  it("orders posts newest-first without mutating the input", () => {
    const a = { id: "a", createdAt: new Date("2026-01-01T00:00:00Z") };
    const b = { id: "b", createdAt: new Date("2026-01-02T00:00:00Z") };
    const c = { id: "c", createdAt: new Date("2026-01-03T00:00:00Z") };
    const input = [a, c, b];
    const sorted = sortByNewest(input);
    expect(sorted.map((p) => p.id)).toEqual(["c", "b", "a"]);
    expect(input.map((p) => p.id)).toEqual(["a", "c", "b"]);
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-05-21T12:00:00Z");
  it("labels recent posts as just now", () => {
    expect(relativeTime(new Date("2026-05-21T11:59:30Z"), now)).toBe(
      "just now",
    );
  });
  it("labels minutes, hours, and days", () => {
    expect(relativeTime(new Date("2026-05-21T11:30:00Z"), now)).toBe("30m");
    expect(relativeTime(new Date("2026-05-21T09:00:00Z"), now)).toBe("3h");
    expect(relativeTime(new Date("2026-05-19T12:00:00Z"), now)).toBe("2d");
  });
});
