import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchProjects } from "@/lib/api/client";

function mockFetchResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
  } as Response;
}

describe("apiRequest", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should complete a successful request", async () => {
    const data = {
      data: [
        {
          id: "1",
          name: "Test Project",
          industry: "Tech",
          problem_statement: "Test",
          stage: "idea",
          is_public: false,
          created_at: "",
          updated_at: "",
        },
      ],
      error: null,
    };
    global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(200, data));

    const result = await fetchProjects();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test Project");
  });

  it("should pass an abort signal to fetch", async () => {
    const data = { data: [], error: null };
    const fetchMock = vi.fn().mockResolvedValue(mockFetchResponse(200, data));
    global.fetch = fetchMock;

    await fetchProjects();

    const callArgs = fetchMock.mock.calls[0];
    const options = callArgs[1] as RequestInit;
    expect(options.signal).toBeDefined();
    expect(options.signal instanceof AbortSignal).toBe(true);
  });

  it("should throw on 401 unauthorized", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockFetchResponse(401, { detail: "Unauthorized" }));

    const error = await fetchProjects()
      .then(() => null)
      .catch((e: Error) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toBe("UNAUTHORIZED");
  });

  it("should throw on network errors", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchProjects()).rejects.toThrow("Failed to fetch");
  });

  it("should throw on envelope error with 200 status", async () => {
    const data = { data: null, error: { message: "Resource not found" } };
    global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(200, data));

    const error = await fetchProjects()
      .then(() => null)
      .catch((e: Error) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toBe("Resource not found");
  });

  it("should throw on HTTP error status", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(500, {}));

    const error = await fetchProjects()
      .then(() => null)
      .catch((e: Error) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toContain("API Error");
  });

  it("should throw when data is null", async () => {
    const data = { data: null, error: null };
    global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(200, data));

    await expect(fetchProjects()).rejects.toThrow("No data returned");
  });

  it("should timeout after REQUEST_TIMEOUT_MS when fetch hangs", async () => {
    global.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_resolve, reject) => {
        const signal = options?.signal as AbortSignal;
        signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true }
        );
      });
    });

    const promise = fetchProjects();
    vi.advanceTimersByTime(30000);
    await Promise.resolve();

    await expect(promise).rejects.toThrow("timed out after 30000ms");
  });
});
