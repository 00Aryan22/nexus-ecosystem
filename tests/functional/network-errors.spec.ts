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

function logCategorized(route: string, cat: Record<string, unknown[]>) {
  for (const [label, items] of Object.entries(cat)) {
    if (items.length > 0) {
      console.log(`[${route}] ${label}:`, JSON.stringify(items, null, 2));
    }
  }
}

test.describe("Network Error Detection", () => {
  for (const route of ALL_ROUTES) {
    test(`${route} — no server errors; expected 401 on /api/auth/me allowed`, async ({
      page,
      monitorReport,
    }) => {
      await page.goto(route, { waitUntil: "networkidle", timeout: 60000 });

      await page.waitForTimeout(3000);

      const errors = monitorReport.errors.filter(
        (e) =>
          !e.text.includes("favicon") &&
          !e.text.includes("Third-party") &&
          !e.text.includes("404")
      );

      logCategorized(route, {
        ...monitorReport.categorized,
        consoleErrors: errors,
        pageErrors: monitorReport.pageErrors,
      });

      const { expectedAuth, unexpectedClientErrors, rateLimited, serverErrors } =
        monitorReport.categorized;

      expect(
        unexpectedClientErrors,
        `Unexpected 4xx errors on ${route}`
      ).toEqual([]);
      expect(
        rateLimited,
        `Rate-limited requests on ${route}`
      ).toEqual([]);
      expect(
        serverErrors,
        `Server errors on ${route}`
      ).toEqual([]);

      if (expectedAuth.length > 0) {
        console.log(`[${route}] Allowed ${expectedAuth.length} expected 401 auth response(s) — no wallet session`);
      }
    });
  }
});
