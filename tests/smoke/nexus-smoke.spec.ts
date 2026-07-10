
import { test, expect } from "@playwright/test";

test.describe("NEXUS AI Production Smoke Tests", () => {
  test("production website loads successfully", async ({ page }) => {
    const response = await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    expect(response).not.toBeNull();

    expect(
      response?.status(),
      `Production website returned HTTP ${response?.status()}`
    ).toBeLessThan(400);

    await expect(page.locator("body")).toBeVisible();
  });

  test("website has a valid NEXUS title", async ({ page }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    await expect(page).toHaveTitle(/NEXUS|Nexus/i);
  });

  test("NEXUS content is visible", async ({ page }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator("body")).toContainText(
      /NEXUS|Nexus/i
    );
  });

  test("website has no uncaught JavaScript errors", async ({
    page,
  }) => {
    const pageErrors: string[] = [];

    page.on("pageerror", error => {
      pageErrors.push(error.message);
    });

    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(5000);

    expect(
      pageErrors,
      `Uncaught JavaScript errors:\n${pageErrors.join("\n")}`
    ).toEqual([]);
  });

  test("website has navigation links", async ({ page }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    const links = page.locator("a[href]");

    expect(await links.count()).toBeGreaterThan(0);
  });
});