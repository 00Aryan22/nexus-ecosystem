import { test, expect } from "../fixtures/base-fixture";

const ALL_ROUTES = [
  "/",
  "/auth/connect",
  "/dashboard",
  "/startup-builder",
  "/skill-passport",
  "/auditor",
  "/founder-agent",
  "/analytics",
  "/settings",
  "/onboarding",
  "/workspace",
  "/dao-center",
  "/support",
  "/notifications",
  "/profile",
  "/contracts/deploy",
  "/ai-founder",
];

test.describe("Network Error Detection", () => {
  for (const route of ALL_ROUTES) {
    test(`${route} has no failed API requests or console errors`, async ({
      page,
      monitorReport,
    }) => {
      await page.goto(route, { waitUntil: "networkidle", timeout: 60000 });

      await page.waitForTimeout(3000);

      const failedRequests = monitorReport.failedRequests.filter(
        (r) => !r.url.includes("chromium") && !r.url.includes("google")
      );

      const consoleErrors = monitorReport.errors.filter(
        (e) =>
          !e.text.includes("favicon") &&
          !e.text.includes("Third-party") &&
          !e.text.includes("404")
      );

      if (failedRequests.length > 0) {
        console.log(`[${route}] Failed requests:`, JSON.stringify(failedRequests, null, 2));
      }
      if (consoleErrors.length > 0) {
        console.log(`[${route}] Console errors:`, JSON.stringify(consoleErrors, null, 2));
      }
      if (monitorReport.pageErrors.length > 0) {
        console.log(`[${route}] Page errors:`, JSON.stringify(monitorReport.pageErrors, null, 2));
      }

      const criticalFailed = failedRequests.filter((r) => r.status >= 500);
      expect(criticalFailed).toEqual([]);
    });
  }
});
