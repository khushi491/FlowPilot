const TOKEN_KEY = "flowpilot_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function persistToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  // Mirror into a cookie so Next.js middleware can gate protected routes.
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}
