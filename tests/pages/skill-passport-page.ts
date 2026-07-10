import { type Locator, type Page } from "@playwright/test";

export class SkillPassportPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly verifySkillButton: Locator;
  readonly statsCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /passport|reputation/i }).first();
    this.verifySkillButton = page.getByRole("button", { name: /verify skill|submit proof/i });
    this.statsCards = page.locator('[class*="stat"]');
  }

  async goto() {
    await this.page.goto("/skill-passport", { waitUntil: "networkidle" });
  }

  async getStatValues(): Promise<string[]> {
    return await this.statsCards.evaluateAll((cards) =>
      cards.map((c) => c.textContent?.trim() ?? "")
    );
  }
}
