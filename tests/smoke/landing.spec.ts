import { test, expect } from "../fixtures/base-fixture";

test.describe("Landing Page", () => {
  test("loads with 200 OK", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
  });

  test("has NEXUS in title", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/NEXUS|Nexus/i);
  });

  test("body contains NEXUS text", async ({ landingPage }) => {
    await landingPage.goto();
    const text = await landingPage.getBodyText();
    expect(text).toMatch(/NEXUS|Nexus/i);
  });

  test("has navigation links", async ({ landingPage }) => {
    await landingPage.goto();
    const links = await landingPage.getAllLinks();
    expect(links.length).toBeGreaterThan(0);
  });

  test("connect wallet button exists", async ({ landingPage }) => {
    await landingPage.goto();
    const button = landingPage.connectWalletButton;
    const exists = await button.isVisible().catch(() => false);
    expect(exists).toBe(true);
  });

  test("auth connect page loads", async ({ page }) => {
    const response = await page.goto("/auth/connect", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
  });
});
