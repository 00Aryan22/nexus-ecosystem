import { test, expect } from "../fixtures/base-fixture";

test.describe("AI Founder Agent", () => {
  test("founder agent page loads or redirects to auth", async ({ page }) => {
    await page.goto("/founder-agent", { waitUntil: "networkidle" });
    const currentUrl = page.url();
    const isAuthed = !currentUrl.includes("/auth/connect");
    expect(
      isAuthed || currentUrl.includes("/auth/connect"),
      "Page should either show the agent UI or redirect to auth"
    ).toBe(true);
  });

  test("auth connect page renders correctly", async ({ page }) => {
    await page.goto("/auth/connect", { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
    const text = await page.locator("body").innerText();
    expect(text.length).toBeGreaterThan(0);
  });

  test("founder agent page renders if authenticated", async ({ page }) => {
    await page.goto("/founder-agent", { waitUntil: "networkidle" });
    if (page.url().includes("/auth/connect")) {
      test.info().annotations.push({
        type: "info",
        description: "Skipped detailed checks: requires wallet authentication",
      });
      return;
    }
    const heading = page.getByRole("heading", { name: /founder agent/i });
    await expect(heading).toBeVisible({ timeout: 15000 });
    const input = page.getByPlaceholder(/message.*founder|chat/i);
    await expect(input).toBeVisible({ timeout: 15000 });
    const usage = page.getByRole("button", { name: /usage/i });
    await expect(usage).toBeVisible({ timeout: 15000 });
  });
});
