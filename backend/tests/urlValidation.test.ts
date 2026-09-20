import { describe, it, expect } from "vitest";
import { validateDestinationUrl } from "../src/utils/urlValidation.js";

describe("validateDestinationUrl", () => {
  it("accepts valid HTTPS URLs", () => {
    expect(validateDestinationUrl("https://wa.me/1234567890").valid).toBe(true);
    expect(validateDestinationUrl("https://mpago.la/abc123").valid).toBe(true);
    expect(validateDestinationUrl("https://example.com").valid).toBe(true);
    expect(
      validateDestinationUrl("https://maps.google.com/?q=cafe").valid
    ).toBe(true);
  });

  it("rejects empty strings", () => {
    expect(validateDestinationUrl("").valid).toBe(false);
    expect(validateDestinationUrl("   ").valid).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(validateDestinationUrl("not-a-url").valid).toBe(false);
    expect(validateDestinationUrl("https://").valid).toBe(false);
  });

  it("rejects HTTP", () => {
    expect(validateDestinationUrl("http://example.com").valid).toBe(false);
  });

  it("rejects javascript: protocol", () => {
    expect(validateDestinationUrl("javascript:alert(1)").valid).toBe(false);
  });

  it("rejects data: protocol", () => {
    expect(validateDestinationUrl("data:text/html,hello").valid).toBe(false);
  });

  it("rejects file: protocol", () => {
    expect(validateDestinationUrl("file:///etc/passwd").valid).toBe(false);
  });

  it("rejects URLs without hostname", () => {
    expect(validateDestinationUrl("https:///path").valid).toBe(false);
  });

  it("rejects embedded credentials", () => {
    expect(
      validateDestinationUrl("https://user:pass@example.com").valid
    ).toBe(false);
  });

  it("rejects control characters", () => {
    expect(validateDestinationUrl("https://example.com\x00").valid).toBe(false);
  });
});
