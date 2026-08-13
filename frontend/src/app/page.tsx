'use client';

import { useState } from 'react';
import { guestLogin } from '@/lib/api';
import { resetThemeToDefaults } from '@/context/theme-context';
import { useRouter } from 'next/navigation';
import { toastInfo } from '@/lib/toast';

/* ─── Inline SVGs ────────────────────────────────────────── */

function PyramidLogo() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="6" fill="#1C1C1E" />
      {/* Right face — solid white */}
      <path
        d="M12 6L18 17.5L12 19.5V6Z"
        fill="#FFFFFF"
      />
      {/* Left face — white outline only (transparent inside for 3D effect) */}
      <path
        d="M12 6L6 17.5L12 19.5"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15.68 8.18c0-.567-.05-1.113-.145-1.636H8v3.094h4.305a3.68 3.68 0 01-1.596 2.415v2.007h2.585c1.513-1.393 2.386-3.444 2.386-5.88z"
      />
      <path
        d="M8 16c2.16 0 3.97-.716 5.294-1.94l-2.585-2.008c-.716.48-1.633.764-2.71.764-2.083 0-3.847-1.408-4.476-3.299H.85v2.073A7.997 7.997 0 008 16z"
      />
      <path
        d="M3.524 9.517A4.813 4.813 0 013.273 8c0-.527.091-1.04.25-1.517V4.41H.85A7.997 7.997 0 000 8c0 1.29.31 2.513.85 3.59l2.674-2.073z"
      />
      <path
        d="M8 3.184c1.175 0 2.229.404 3.058 1.196l2.295-2.294C11.967.786 10.157 0 8 0A7.997 7.997 0 00.85 4.41l2.674 2.073C4.153 4.592 5.917 3.184 8 3.184z"
      />
    </svg>
  );
}

/* ─── Login Page ─────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGuestLogin() {
    try {
      setLoading(true);
      setError('');
      await guestLogin();
      resetThemeToDefaults();
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    toastInfo('Google login is not yet available.', 'Coming soon');
  }

  return (
    <main className="login-page" id="login-page">
      <div className="login-container">
        {/* Brand */}
        <div className="login-brand" id="login-brand">
          <PyramidLogo />
          <span className="login-brand-name">Pyramid</span>
        </div>

        {/* Card */}
        <div className="login-card" id="login-card">
          <div className="login-header">
            <h1 className="login-heading" id="login-heading">
              Let&apos;s get back on track
            </h1>
            <p className="login-subtext" id="login-subtext">
              Enter your email below to login to your account.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="login-error" role="alert" id="login-error">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="login-actions">
            <button
              type="button"
              id="btn-guest-login"
              className="login-btn login-btn-primary"
              onClick={handleGuestLogin}
              disabled={loading}
            >
              {loading ? (
                <span className="login-btn-spinner" aria-label="Loading" />
              ) : (
                'Continue as Guest'
              )}
            </button>

            <button
              type="button"
              id="btn-google-login"
              className="login-btn login-btn-outline"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <GoogleIcon />
              Login with Google
            </button>
          </div>
        </div>

        {/* Footer — sits outside the card */}
        <p className="login-footer" id="login-footer">
          By clicking continue, you agree to<br />
          our <span className="login-link">Terms of Service</span> and <span className="login-link">Privacy<br />
          Policy</span>
        </p>
      </div>
    </main>
  );
}
