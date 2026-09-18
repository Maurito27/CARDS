import { describe, it, expect } from "vitest";
import { generatePublicId } from "../src/utils/publicId.js";

describe("generatePublicId", () => {
  it("generates an ID of the expected length", () => {
    expect(generatePublicId()).toHaveLength(16);
  });

  it("uses only URL-safe base62 characters", () => {
    const id = generatePublicId();
    expect(id).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("generates unique IDs across 10 000 calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      ids.add(generatePublicId());
    }
    expect(ids.size).toBe(10_000);
  });

  it("is non-sequential", () => {
    const ids = Array.from({ length: 100 }, () => generatePublicId());
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i]).not.toBe(ids[i - 1]);
    }
  });
});
