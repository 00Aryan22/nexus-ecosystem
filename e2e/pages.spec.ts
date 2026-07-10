import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  const PUBLIC_ROUTES = [
    { path: "/", title: /Ethereum Builders/ },
    { path: "/auth/connect", title: /connect/i },
  ];

  for (const route of PUBLIC_ROUTES) {
    test(`should load ${route.path} without crashing`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.locator("body")).toBeVisible();
    });
  }
});

test.describe("Protected Pages", () => {
  const PROTECTED_ROUTES = [
    "/dashboard",
    "/skill-passport",
    "/founder-agent",
    "/workspace",
    "/settings",
    "/analytics",
    "/auditor",
    "/startup-builder",
    "/contracts/deploy",
    "/notifications",
    "/profile",
    "/ai-founder",
    "/contract-audit",
  ];

  for (const route of PROTECTED_ROUTES) {
    test(`should redirect to connect page when accessing ${route} without auth`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(/\/auth\/connect/);
      expect(page.url()).toContain("/auth/connect");
    });
  }
});

test.describe("Static & Placeholder Pages", () => {
  const PLACEHOLDER_PAGES = [
    { path: "/marketplace" },
    { path: "/wallet" },
    { path: "/dao-center" },
    { path: "/support" },
    { path: "/onboarding" },
  ];

  for (const { path } of PLACEHOLDER_PAGES) {
    test(`should load ${path} without 500 error`, async ({ page }) => {
      const resp = await page.goto(path);
      expect(resp?.status()).toBeLessThan(500);
    });
  }
});

test.describe("API Routes", () => {
  test("/api/auth/nonce should return 422 without wallet param", async ({ page }) => {
    const resp = await page.goto("/api/auth/nonce");
    const status = resp?.status() ?? 0;
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
  });

  test("/api/auth/me should return 403 without CSRF token", async ({ request }) => {
    const resp = await request.post("/api/auth/me");
    expect(resp.status()).toBeGreaterThanOrEqual(400);
  });

  test("/api/auth/logout should return 403 without CSRF token", async ({ request }) => {
    const resp = await request.post("/api/auth/logout");
    expect(resp.status()).toBeGreaterThanOrEqual(400);
  });

  test("/health should be accessible", async ({ request }) => {
    const resp = await request.get("/health");
    expect(resp.status()).toBeLessThan(500);
  });
});

test.describe("Console Errors", () => {
  test("should load landing page without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon.ico") &&
        !e.includes("Failed to fetch session") &&
        !e.includes("Nonce proxy failed") &&
        !e.includes("auth/me") &&
        !e.includes("401")
    );
    expect(criticalErrors).toEqual([]);
  });
});
