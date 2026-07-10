import { type Locator, type Page } from "@playwright/test";

export class FounderAgentPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly providerSelector: Locator;
  readonly modelSelector: Locator;
  readonly conversationSidebar: Locator;
  readonly newConversationButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /founder agent/i });
    this.chatInput = page.getByPlaceholder(/message your.*founder/i);
    this.sendButton = page.getByRole("button", { name: /send/i });
    this.providerSelector = page.getByRole("button", { name: /provider/i });
    this.modelSelector = page.getByRole("button", { name: /model/i });
    this.conversationSidebar = page.locator("aside").first();
    this.newConversationButton = page.getByRole("button", { name: /new/i });
  }

  async goto() {
    await this.page.goto("/founder-agent", { waitUntil: "networkidle" });
  }

  async sendMessage(text: string) {
    await this.chatInput.fill(text);
    await this.sendButton.click();
  }

  async waitForResponse(timeout = 60000) {
    await this.page.waitForFunction(
      () => {
        const messages = document.querySelectorAll("[role='log'] > div");
        if (!messages.length) return false;
        const last = messages[messages.length - 1];
        return last.textContent && last.textContent.length > 0;
      },
      { timeout }
    );
  }

  async isProviderAvailable(provider: string): Promise<boolean> {
    await this.providerSelector.click();
    const option = this.page.getByRole("option", { name: new RegExp(provider, "i") });
    const visible = await option.isVisible();
    await this.providerSelector.click();
    return visible;
  }
}
