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

export type CategorizedRequests = {
  expectedAuth: NetworkIssue[];
  unexpectedClientErrors: NetworkIssue[];
  rateLimited: NetworkIssue[];
  serverErrors: NetworkIssue[];
  other: NetworkIssue[];
};

export type MonitorReport = {
  errors: ConsoleIssue[];
  warnings: ConsoleIssue[];
  failedRequests: NetworkIssue[];
  categorized: CategorizedRequests;
  pageErrors: string[];
  unhandledRejections: string[];
};

function categorizeRequest(issue: NetworkIssue): keyof CategorizedRequests {
  const url = issue.url.toLowerCase();
  if (issue.status === 401 && url.includes("/api/auth/me")) {
    return "expectedAuth";
  }
  if (issue.status === 429) {
    return "rateLimited";
  }
  if (issue.status >= 500) {
    return "serverErrors";
  }
  if (issue.status >= 400 && issue.status < 500) {
    return "unexpectedClientErrors";
  }
  return "other";
}

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
      const issue: NetworkIssue = {
        url: response.url(),
        status,
        method: response.request().method(),
        type: response.request().resourceType(),
      };
      report.failedRequests.push(issue);
      const category = categorizeRequest(issue);
      report.categorized[category].push(issue);
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
    categorized: {
      expectedAuth: [],
      unexpectedClientErrors: [],
      rateLimited: [],
      serverErrors: [],
      other: [],
    },
    pageErrors: [],
    unhandledRejections: [],
  };
}
