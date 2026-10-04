import { defineConfig, devices } from "@playwright/test";

const database = process.env.QUIRK_E2E_DATABASE_URL;
const port = Number(process.env.QUIRK_E2E_PORT);
if (!database || !Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(
    "Run bun run test:e2e so tests receive an isolated database and port.",
  );
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `bun run build && bun run start --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    env: { DATABASE_URL: database },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
