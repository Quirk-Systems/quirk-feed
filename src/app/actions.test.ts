import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ run: vi.fn(), revalidate: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({ insert: () => ({ values: () => ({ run: mocks.run }) }) }),
}));
import { createPost } from "./actions";

function form(body: string) {
  const data = new FormData();
  data.set("body", body);
  return data;
}

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("createPost boundary", () => {
  it("saves valid text and invalidates the feed", async () => {
    expect(await createPost({}, form("hello"))).toEqual({ ok: true });
    expect(mocks.run).toHaveBeenCalledOnce();
    expect(mocks.revalidate).toHaveBeenCalledWith("/");
  });
  it.each(["", " ", "x".repeat(281)])(
    "rejects invalid body before writing: %s",
    async (body) => {
      expect(await createPost({}, form(body))).toHaveProperty("error");
      expect(mocks.run).not.toHaveBeenCalled();
      expect(mocks.revalidate).not.toHaveBeenCalled();
    },
  );
  it.each(["body", "author"])(
    "rejects an uploaded file in %s",
    async (field) => {
      const data = form("hello");
      data.set(field, new File(["file contents"], "post.txt"));
      expect(await createPost({}, data)).toHaveProperty(
        "error",
        "Use text for your handle and post.",
      );
      expect(mocks.run).not.toHaveBeenCalled();
    },
  );
  it("returns a recoverable error without leaking database details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.run.mockImplementation(() => {
      throw new Error("private database path");
    });
    const result = await createPost({}, form("keep my draft"));
    expect(result.error).toContain("Your draft is still here");
    expect(result.error).not.toContain("private database path");
    expect(result.ok).toBeUndefined();
    expect(mocks.revalidate).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith("[quirk-feed] Could not save post", {
      code: "UNEXPECTED_ERROR",
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "private database path",
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain("keep my draft");
  });
});
