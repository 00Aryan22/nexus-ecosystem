import { test } from "@playwright/test";
import { LandingPage } from "../pages/landing-page";

const BASE_URL = "https://nexus-ecosystem-web.vercel.app";

test.describe("NEXUS AI Professional Demo", () => {
  test("Complete application showcase", async ({ page }) => {
    test.setTimeout(600000);

    await page.setViewportSize({ width: 1920, height: 1080 });

    const landing = new LandingPage(page);

    await test.step("1. Landing page hero", async () => {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      await page.waitForTimeout(1500);
    });

    await test.step("2. Scroll through landing page", async () => {
      await page.evaluate(() =>
        window.scrollTo({ top: document.body.scrollHeight / 3, behavior: "smooth" })
      );
      await page.waitForTimeout(1500);
      await page.evaluate(() =>
        window.scrollTo({ top: (document.body.scrollHeight * 2) / 3, behavior: "smooth" })
      );
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      await page.waitForTimeout(2000);
    });

    await test.step("3. Open Auth Connect page", async () => {
      await page.goto(`${BASE_URL}/auth/connect`, { waitUntil: "networkidle" });
      await page.waitForTimeout(3000);
    });

    await test.step("4. Dashboard overview", async () => {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
      await page.waitForTimeout(3000);
    });

    await test.step("5. AI Founder Agent", async () => {
      await page.goto(`${BASE_URL}/founder-agent`, { waitUntil: "networkidle" });
      await page.waitForTimeout(3000);

      const chatInput = page.getByPlaceholder(/message.*founder|chat/i);
      if (await chatInput.isVisible()) {
        await page.waitForTimeout(2000);
      }
      await page.waitForTimeout(2000);
    });

    await test.step("6. Smart Contract Auditor", async () => {
      await page.goto(`${BASE_URL}/auditor`, { waitUntil: "networkidle" });
      await page.waitForTimeout(3000);
    });

    await test.step("7. Skill Passport", async () => {
      await page.goto(`${BASE_URL}/skill-passport`, { waitUntil: "networkidle" });
      await page.waitForTimeout(3000);
    });

    await test.step("8. Analytics", async () => {
      await page.goto(`${BASE_URL}/analytics`, { waitUntil: "networkidle" });
      await page.waitForTimeout(3000);
    });

    await test.step("9. Startup Builder", async () => {
      await page.goto(`${BASE_URL}/startup-builder`, { waitUntil: "networkidle" });
      await page.waitForTimeout(3000);
    });

    await test.step("10. Settings", async () => {
      await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
      await page.waitForTimeout(3000);
    });

    await test.step("11. Workspace", async () => {
      await page.goto(`${BASE_URL}/workspace`, { waitUntil: "networkidle" });
      await page.waitForTimeout(3000);
    });

    await test.step("12. Final - Back to Dashboard", async () => {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
      await page.waitForTimeout(3000);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      await page.waitForTimeout(2000);
    });
  });
});
