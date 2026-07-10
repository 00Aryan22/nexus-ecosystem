import { test, expect } from "../fixtures/base-fixture";

test.describe("Dashboard", () => {
  test("dashboard page loads", async ({ page }) => {
    const response = await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
  });

  test("startup-builder page loads", async ({ page }) => {
    const response = await page.goto("/startup-builder", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
  });

  test("skill-passport page loads", async ({ page }) => {
    const response = await page.goto("/skill-passport", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
  });

  test("auditor page loads", async ({ page }) => {
    const response = await page.goto("/auditor", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
  });

  test("founder-agent page loads", async ({ page }) => {
    const response = await page.goto("/founder-agent", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
  });

  test("analytics page loads", async ({ page }) => {
    const response = await page.goto("/analytics", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
  });

  test("settings page loads", async ({ page }) => {
    const response = await page.goto("/settings", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
  });

  test("onboarding page loads", async ({ page }) => {
    const response = await page.goto("/onboarding", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
  });

  test("workspace page loads", async ({ page }) => {
    const response = await page.goto("/workspace", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
  });
});
