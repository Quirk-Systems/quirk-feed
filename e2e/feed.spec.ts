import { test, expect } from "@playwright/test";
import Database from "better-sqlite3";

function withDatabase(callback: (db: Database.Database) => void) {
  const filename = process.env.QUIRK_E2E_DATABASE_URL;
  if (!filename) throw new Error("E2E requires its isolated database.");
  const db = new Database(filename, { fileMustExist: true });
  try {
    callback(db);
  } finally {
    db.close();
  }
}

test.beforeEach(() => {
  withDatabase((db) =>
    db.exec("DROP TRIGGER IF EXISTS e2e_reject_post; DELETE FROM posts;"),
  );
});

test("homepage is readable with an empty timeline and no hydration errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/Quirk Feed/);
  await expect(page.getByRole("heading", { name: "Quirk Feed" })).toBeVisible();
  await expect(
    page.getByText("Nothing here yet. Be the first to post."),
  ).toBeVisible();
  await expect(page.getByLabel("Post", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("posting persists, clears the successful draft, and refreshes the timeline", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Handle").fill("tester");
  await page.getByLabel("Post", { exact: true }).fill("A quirk worth keeping");
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Quirk posted.");
  await expect(page.getByLabel("Post", { exact: true })).toHaveValue("");
  await expect(page.locator("article").first()).toContainText(
    "A quirk worth keeping",
  );
  await page.reload();
  await expect(page.locator("article").first()).toContainText(
    "A quirk worth keeping",
  );
});

test("same-second posts display in insertion order, newest first", async ({
  page,
}) => {
  withDatabase((db) => {
    const insert = db.prepare(
      "INSERT INTO posts (id, author, body, created_at) VALUES (?, ?, ?, ?)",
    );
    insert.run("z-first", "tester", "Earlier quirk", 1_789_000_000);
    insert.run("a-last", "tester", "Later quirk", 1_789_000_000);
  });
  await page.goto("/");
  await expect(page.locator("article").first()).toContainText("Later quirk");
});

test("failed writes retain the draft and can be retried", async ({ page }) => {
  withDatabase((db) =>
    db.exec(
      "CREATE TRIGGER e2e_reject_post BEFORE INSERT ON posts BEGIN SELECT RAISE(ABORT, 'E2E forced write failure'); END;",
    ),
  );
  await page.goto("/");
  await page.getByLabel("Handle").fill("tester");
  await page
    .getByLabel("Post", { exact: true })
    .fill("Keep my unfinished thought");
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Couldn't save your quirk.",
  );
  await expect(page.getByLabel("Post", { exact: true })).toHaveValue(
    "Keep my unfinished thought",
  );
  await expect(page.getByLabel("Handle")).toHaveValue("tester");
  withDatabase((db) => db.exec("DROP TRIGGER e2e_reject_post;"));
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.locator("article")).toContainText(
    "Keep my unfinished thought",
  );
});

test("oversized action requests are rejected without writing or losing the draft", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Post", { exact: true }).fill("Keep this small draft");
  await page.locator("form").evaluate((form) => {
    const extra = document.createElement("input");
    extra.type = "hidden";
    extra.name = "extra";
    extra.value = "x".repeat(32 * 1024);
    form.append(extra);
  });
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Couldn't confirm your post.",
  );
  await expect(page.getByLabel("Post", { exact: true })).toHaveValue(
    "Keep this small draft",
  );
  withDatabase((db) =>
    expect(db.prepare("SELECT count(*) AS count FROM posts").get()).toEqual({
      count: 0,
    }),
  );
});

test("theme selection survives reload", async ({ page }) => {
  await page.goto("/");
  const before = await page.locator("html").getAttribute("class");
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("class", before ?? "");
  const after = await page.locator("html").getAttribute("class");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("class", after ?? "");
});
