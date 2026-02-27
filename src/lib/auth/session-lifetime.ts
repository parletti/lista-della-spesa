export const SESSION_MAX_AGE_DAYS = 30;
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
export const SESSION_STARTED_AT_COOKIE = "app_session_started_at";

function secureFlag() {
  if (typeof window === "undefined") return "";
  return window.location.protocol === "https:" ? "; Secure" : "";
}

export function setSessionStartedCookie() {
  if (typeof document === "undefined") return;
  const now = Date.now();
  const maxAge = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${SESSION_STARTED_AT_COOKIE}=${now}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secureFlag()}`;
}

export function clearSessionStartedCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_STARTED_AT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secureFlag()}`;
}

export function getSessionStartedAtFromCookie() {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";").map((entry) => entry.trim());
  const raw = cookies.find((entry) => entry.startsWith(`${SESSION_STARTED_AT_COOKIE}=`));
  if (!raw) return null;
  const value = raw.slice(`${SESSION_STARTED_AT_COOKIE}=`.length);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
