import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/demo",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "test-results/reports/demo-html", open: "never" }],
  ],
  use: {
    baseURL: "https://nexus-ecosystem-web.vercel.app",
    trace: "on",
    screenshot: "on",
    video: "on",
    actionTimeout: 30_000,
    navigationTimeout: 120_000,
  },
  projects: [
    {
      name: "demo-chromium",
      use: {
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ["--disable-blink-features=AutomationControlled"],
        },
      },
    },
  ],
  outputDir: "test-results",
});
