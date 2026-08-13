const AUTH_COOKIE = 'tms-auth';
const AUTH_MAX_AGE_SEC = 7 * 86400;

export function setAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${AUTH_MAX_AGE_SEC}; SameSite=Lax`;
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
