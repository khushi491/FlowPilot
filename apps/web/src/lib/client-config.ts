/** Browser API calls go through the Next.js same-origin BFF (`/api`). */
export function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (!configured || configured === "/") return "/api";
  return configured.replace(/\/$/, "");
}

export function wsBaseUrl() {
  return process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
}
