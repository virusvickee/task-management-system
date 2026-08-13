import { resetThemeToDefaults } from '@/context/theme-context';
import { clearAuthCookie, setAuthCookie } from '@/lib/auth-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const LOGIN_PATH = '/';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tms-token');
}

export function getStoredUserName(): string {
  if (typeof window === 'undefined') return 'You';
  try {
    const raw = localStorage.getItem('tms-user');
    if (!raw) return 'You';
    const user = JSON.parse(raw) as { name?: string };
    return user.name?.trim() || 'You';
  } catch {
    return 'You';
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  if (!API_BASE) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }
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
  setAuthCookie();
  return data;
}

/** Clear session + reset theme, then hard-redirect to login for a clean slate. */
export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('tms-token');
  localStorage.removeItem('tms-user');
  clearAuthCookie();
  resetThemeToDefaults();
  window.location.href = LOGIN_PATH;
}
