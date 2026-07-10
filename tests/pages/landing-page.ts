import { type Locator, type Page } from "@playwright/test";

export class LandingPage {
  readonly page: Page;
  readonly body: Locator;
  readonly navLinks: Locator;
  readonly connectWalletButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.body = page.locator("body");
    this.navLinks = page.locator("a[href]");
    this.connectWalletButton = page.getByRole("button", {
      name: /connect|sign in|wallet/i,
    });
  }

  async goto() {
    await this.page.goto("/", { waitUntil: "networkidle" });
  }

  async getTitle() {
    return await this.page.title();
  }

  async getBodyText() {
    return await this.body.innerText();
  }

  async getAllLinks() {
    return await this.navLinks.all();
  }

  async getLinkHrefs(): Promise<string[]> {
    return await this.navLinks.evaluateAll((links) =>
      links.map((l) => (l as HTMLAnchorElement).href)
    );
  }

  async clickConnectWallet() {
    if (await this.connectWalletButton.isVisible()) {
      await this.connectWalletButton.click();
    }
  }
}
