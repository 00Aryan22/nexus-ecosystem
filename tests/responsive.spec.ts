import { test, expect } from "./fixtures/base-fixture";

test.describe("Responsive Layout", () => {
  const ROUTES = ["/", "/dashboard", "/auth/connect", "/founder-agent", "/skill-passport"];

  for (const route of ROUTES) {
    test(`${route} renders at 1280x800`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      const resp = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(resp?.status()).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
    });

    test(`${route} renders at 375x667 (mobile)`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const resp = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(resp?.status()).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
    });
  }
});
