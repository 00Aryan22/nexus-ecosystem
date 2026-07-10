import { type Locator, type Page } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly sidebar: Locator;
  readonly navItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("h1, h2").first();
    this.sidebar = page.locator("aside");
    this.navItems = page.locator("aside a");
  }

  async goto() {
    await this.page.goto("/dashboard", { waitUntil: "networkidle" });
  }

  async isLoaded() {
    await this.page.waitForLoadState("networkidle");
    return await this.page.locator("body").isVisible();
  }

  async getHeadingText() {
    return await this.heading.textContent();
  }

  async navigateTo(section: string) {
    const link = this.page.getByRole("link", { name: new RegExp(section, "i") });
    await link.click();
    await this.page.waitForLoadState("networkidle");
  }

  async getVisibleNavItems(): Promise<string[]> {
    return await this.navItems.evaluateAll((items) =>
      items.map((i) => (i as HTMLAnchorElement).textContent?.trim() ?? "")
    );
  }
}
