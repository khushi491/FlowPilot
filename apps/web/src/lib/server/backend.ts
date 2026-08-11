const TOKEN_COOKIE = "flowpilot_token";
const ONE_WEEK = 60 * 60 * 24 * 7;

export function backendBaseUrl() {
  return (
    process.env.API_INTERNAL_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:8000"
  ).replace(/\/$/, "");
}

export function sessionCookieOptions(maxAge = ONE_WEEK) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export { TOKEN_COOKIE, ONE_WEEK };
