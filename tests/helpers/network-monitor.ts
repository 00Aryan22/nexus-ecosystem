import { type Page } from "@playwright/test";

export type NetworkIssue = {
  url: string;
  status: number;
  method: string;
  type: string;
};

export type ConsoleIssue = {
  type: string;
  text: string;
  url?: string;
};

export type MonitorReport = {
  errors: ConsoleIssue[];
  warnings: ConsoleIssue[];
  failedRequests: NetworkIssue[];
  pageErrors: string[];
  unhandledRejections: string[];
};

export function createNetworkMonitor(page: Page, report: MonitorReport) {
  page.on("console", (msg) => {
    const entry: ConsoleIssue = {
      type: msg.type(),
      text: msg.text(),
      url: page.url(),
    };
    if (msg.type() === "error") {
      report.errors.push(entry);
    } else if (msg.type() === "warning") {
      report.warnings.push(entry);
    }
  });

  page.on("pageerror", (err) => {
    report.pageErrors.push(err.message);
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      report.failedRequests.push({
        url: response.url(),
        status,
        method: response.request().method(),
        type: response.request().resourceType(),
      });
    }
  });

  page.on("crash", () => {
    report.pageErrors.push("Page crashed");
  });
}

export function createEmptyReport(): MonitorReport {
  return {
    errors: [],
    warnings: [],
    failedRequests: [],
    pageErrors: [],
    unhandledRejections: [],
  };
}
