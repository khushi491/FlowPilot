import { describe, expect, it } from "vitest";

const PROTECTED_PREFIXES = ["/dashboard", "/workflows", "/runs", "/documents", "/templates"];

function needsAuth(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

describe("middleware route matching", () => {
  it("protects dashboard and nested workflow routes", () => {
    expect(needsAuth("/dashboard")).toBe(true);
    expect(needsAuth("/workflows/abc")).toBe(true);
    expect(needsAuth("/runs")).toBe(true);
  });

  it("allows public auth and marketing pages", () => {
    expect(needsAuth("/")).toBe(false);
    expect(needsAuth("/login")).toBe(false);
    expect(needsAuth("/signup")).toBe(false);
  });
});
