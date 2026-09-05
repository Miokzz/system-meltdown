import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 90000,
  workers: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    headless: true,
    launchOptions: { executablePath: process.env.CHROME_EXECUTABLE },
    screenshot: "only-on-failure",
  },
  reporter: "list",
});
