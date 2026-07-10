import { test, expect } from "../fixtures/base-fixture";

test.describe("Dashboard Features", () => {
  test("dashboard has stat cards", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const isAuthRedirect = page.url().includes("/auth/connect");
    if (isAuthRedirect) {
      test.info().annotations.push({
        type: "info",
        description: "Skipped: requires wallet authentication",
      });
      return;
    }
    const stats = page.locator('[class*="stat"], [class*="card"]').first();
    await expect(stats).toBeVisible({ timeout: 15000 });
  });

  test("startup-builder has project form", async ({ page }) => {
    await page.goto("/startup-builder", { waitUntil: "networkidle" });
    const isAuthRedirect = page.url().includes("/auth/connect");
    if (isAuthRedirect) {
      test.info().annotations.push({
        type: "info",
        description: "Skipped: requires wallet authentication",
      });
      return;
    }
    const addButton = page.getByRole("button", { name: /add project/i });
    await expect(addButton).toBeVisible({ timeout: 15000 });
  });

  test("landing page renders with navigation links", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /agentic os/i })).toBeVisible({ timeout: 15000 });
    const buttons = page.getByRole("link", { name: /open dashboard|mint passport/i });
    await expect(buttons.first()).toBeVisible({ timeout: 15000 });
  });
});
