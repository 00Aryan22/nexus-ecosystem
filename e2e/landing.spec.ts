import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should load with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Ethereum Builders");
  });

  test("should show Connect Wallet button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /connect wallet/i })).toBeVisible();
  });

  test("should show Open Dashboard link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /open dashboard/i })).toBeVisible();
  });

  test("should show Mint Passport link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /mint passport/i })).toBeVisible();
  });

  test("should show three feature cards", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator(".glass-card");
    await expect(cards).toHaveCount(3);
  });

  test("should show API and chain info in footer", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("p.font-mono");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("API:");
    await expect(footer).toContainText("Chain");
  });
});

test.describe("Navigation", () => {
  test("should navigate to Dashboard (redirect to auth)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /open dashboard/i }).click();
    await page.waitForURL(/\/(auth\/connect|dashboard)/);
    expect(page.url()).toMatch(/\/(auth\/connect|dashboard)/);
  });

  test("should navigate to Skill Passport (redirect to auth)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /mint passport/i }).click();
    await page.waitForURL(/\/(auth\/connect|skill-passport)/);
    expect(page.url()).toMatch(/\/(auth\/connect|skill-passport)/);
  });
});

test.describe("Connect Wallet Modal", () => {
  test("should open modal when clicking Connect Wallet", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /connect wallet/i }).click();
    await expect(page.getByText(/choose metamask/i)).toBeVisible();
    await expect(page.getByText(/walletconnect qr/i)).toBeVisible();
  });

  test("should close modal when clicking Close", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /connect wallet/i }).click();
    await page.getByRole("button", { name: /close/i }).click();
    await expect(page.getByText(/choose metamask/i)).not.toBeVisible();
  });

  test("should show MetaMask and WalletConnect options", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /connect wallet/i }).click();
    await expect(page.getByText(/metamask extension/i)).toBeVisible();
    await expect(page.getByText(/walletconnect qr/i)).toBeVisible();
  });
});
