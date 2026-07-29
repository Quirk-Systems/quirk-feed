import { test, expect } from "@playwright/test";

test("homepage is the Quirk Feed", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Quirk Feed/);
  await expect(page.getByRole("heading", { name: "Quirk Feed" })).toBeVisible();
});

test("posting a quirk adds it to the top of the timeline", async ({ page }) => {
  const body = `e2e quirk ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await page.goto("/");
  await page.getByLabel("Handle").fill("tester");
  await page.getByLabel("Post").fill(body);
  await page.getByRole("button", { name: "Post" }).click();

  await expect(page.getByText(body)).toBeVisible();
});
