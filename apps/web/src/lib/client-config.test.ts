import { describe, expect, it } from "vitest";
import { apiBaseUrl } from "@/lib/client-config";

describe("apiBaseUrl", () => {
  it("defaults to the same-origin BFF path", () => {
    expect(apiBaseUrl() === "/api" || apiBaseUrl().endsWith("/api")).toBe(true);
  });
});
