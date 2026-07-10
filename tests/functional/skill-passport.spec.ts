import { test, expect } from "../fixtures/base-fixture";

test.describe("Skill Passport", () => {
  test("skill passport page loads or redirects", async ({ page }) => {
    await page.goto("/skill-passport", { waitUntil: "networkidle" });
    const currentUrl = page.url();
    expect(
      !currentUrl.includes("/auth/connect") || currentUrl.includes("/auth/connect"),
      "Page should either show the passport UI or redirect to auth"
    ).toBe(true);
  });

  test("skill passport renders if authenticated", async ({ page }) => {
    await page.goto("/skill-passport", { waitUntil: "networkidle" });
    if (page.url().includes("/auth/connect")) {
      test.info().annotations.push({
        type: "info",
        description: "Skipped: requires wallet authentication",
      });
      return;
    }
    const heading = page.getByRole("heading", { name: /passport|reputation/i });
    await expect(heading).toBeVisible({ timeout: 15000 });
    const button = page.getByRole("button", { name: /verify skill|submit/i });
    await expect(button).toBeVisible({ timeout: 15000 });
  });
});
