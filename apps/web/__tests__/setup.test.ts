import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("should run a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string operations", () => {
    expect("hello".toUpperCase()).toBe("HELLO");
  });

  it("should work with arrays", () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr.map((x) => x * 2)).toEqual([2, 4, 6]);
  });
});
