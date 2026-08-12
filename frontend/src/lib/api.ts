import { resetThemeToDefaults } from '@/context/theme-context';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const LOGIN_PATH = '/';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tms-token');
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function guestLogin(name?: string) {
  const data = await apiFetch('/auth/guest', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  localStorage.setItem('tms-token', data.accessToken);
  localStorage.setItem('tms-user', JSON.stringify(data.user));
  return data;
}

/** Clear session + reset theme, then hard-redirect to login for a clean slate. */
export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('tms-token');
  localStorage.removeItem('tms-user');
  resetThemeToDefaults();
  window.location.href = LOGIN_PATH;
}
