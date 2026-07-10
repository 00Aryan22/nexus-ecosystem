import { test as base } from "@playwright/test";
import { LandingPage } from "../pages/landing-page";
import { DashboardPage } from "../pages/dashboard-page";
import { FounderAgentPage } from "../pages/founder-agent-page";
import { SkillPassportPage } from "../pages/skill-passport-page";
import {
  createNetworkMonitor,
  createEmptyReport,
  type MonitorReport,
} from "../helpers/network-monitor";

type NexusFixtures = {
  landingPage: LandingPage;
  dashboardPage: DashboardPage;
  founderAgentPage: FounderAgentPage;
  skillPassportPage: SkillPassportPage;
  monitorReport: MonitorReport;
};

export const test = base.extend<NexusFixtures>({
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  founderAgentPage: async ({ page }, use) => {
    await use(new FounderAgentPage(page));
  },

  skillPassportPage: async ({ page }, use) => {
    await use(new SkillPassportPage(page));
  },

  monitorReport: async ({ page }, use) => {
    const report = createEmptyReport();
    createNetworkMonitor(page, report);
    await use(report);
  },
});

export { expect } from "@playwright/test";
