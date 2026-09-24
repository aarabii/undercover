import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:4321",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "bun run --cwd apps/server dev --port 8787",
      port: 8787,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: "bun run --cwd apps/web dev --port 4321",
      port: 4321,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
