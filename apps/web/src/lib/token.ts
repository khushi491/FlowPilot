"use client";

/**
 * Legacy localStorage helpers — session now lives in an HttpOnly cookie via `/api`.
 * Kept only to clear older client-side tokens on upgrade.
 */
const TOKEN_KEY = "flowpilot_token";

export function clearLegacyClientTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  // Clear any previous non-HttpOnly mirror cookie written by older builds.
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}
