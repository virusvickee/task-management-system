'use client';

import { useState } from 'react';
import { guestLogin } from '@/lib/api';
import { resetThemeToDefaults } from '@/context/theme-context';
import { useRouter } from 'next/navigation';

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
    // Placeholder — Google OAuth not yet integrated
    alert('Google login is not yet available.');
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

      <style jsx>{`
        /* ── Page ──────────────────────────────────────── */
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100vh;
          height: 100dvh;
          margin: 0 auto;
          padding: 40px;
          background: var(--base-background, #FFFFFF);
        }

        /* ── Container ─────────────────────────────────── */
        .login-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          width: 100%;
          max-width: 420px;
        }

        /* ── Brand ─────────────────────────────────────── */
        .login-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 24px;
        }

        .login-brand-name {
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          font-weight: 600;
          font-style: normal;
          font-size: 14px;
          line-height: 1;
          letter-spacing: 0;
          color: #000000;
        }

        :global(.dark) .login-brand-name {
          color: #ffffff;
        }

        /* ── Card ──────────────────────────────────────── */
        .login-card {
          width: 420px;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
          border: 1px solid var(--base-border, rgba(229, 229, 229, 1));
          border-radius: 24px;
          padding: 24px;
          text-align: center;
          opacity: 1;
          box-shadow: var(--shadowxsoffset-x) var(--shadowxsoffset-y) var(--shadowxsblur-radius) var(--shadowxsspread-radius) var(--shadowxscolor);
          background: var(--base-background, #FFFFFF);
        }

        :global(.dark) .login-card {
          background: #111111;
          border-color: rgba(255, 255, 255, 0.08);
        }

        /* ── Header ────────────────────────────────────── */
        .login-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* ── Heading ───────────────────────────────────── */
        .login-heading {
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          font-weight: 600;
          font-style: normal;
          font-size: 24px;
          line-height: 1.25;
          letter-spacing: -0.02em;
          text-align: center;
          color: #000000;
          margin: 0;
        }

        :global(.dark) .login-heading {
          color: #f5f5f5;
        }

        /* ── Subtext ───────────────────────────────────── */
        .login-subtext {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.5;
          margin: 0;
        }

        /* ── Error ─────────────────────────────────────── */
        .login-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 13px;
          margin-bottom: 20px;
          text-align: left;
        }

        :global(.dark) .login-error {
          background: #1c1111;
          border-color: #4c1d1d;
          color: #fca5a5;
        }

        /* ── Actions ───────────────────────────────────── */
        .login-actions {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 12px;
        }

        /* ── Buttons ───────────────────────────────────── */
        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 40px;
          padding: 0 24px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          border: none;
          transition: opacity 0.15s ease;
        }

        .login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-btn:focus-visible {
          outline: 2px solid var(--foreground);
          outline-offset: 2px;
        }

        /* Primary (dark) button */
        .login-btn-primary {
          background: #171717;
          color: #FFFFFF;
        }

        :global(.dark) .login-btn-primary {
          background: #ededed;
          color: #0a0a0a;
        }

        .login-btn-primary:not(:disabled):hover {
          opacity: 0.9;
        }

        .login-btn-primary:not(:disabled):active {
          opacity: 0.8;
        }

        /* Outline button */
        .login-btn-outline {
          background: var(--base-background, #FFFFFF);
          color: var(--foreground);
          border: 1px solid #E5E5E5;
        }

        :global(.dark) .login-btn-outline {
          border-color: #262626;
        }

        .login-btn-outline:not(:disabled):hover {
          background: #FAFAFA;
        }

        :global(.dark) .login-btn-outline:not(:disabled):hover {
          background: #1a1a1a;
        }

        .login-btn-outline:not(:disabled):active {
          background: #F5F5F5;
        }

        :global(.dark) .login-btn-outline:not(:disabled):active {
          background: #222222;
        }

        /* Spinner */
        .login-btn-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Footer ────────────────────────────────────── */
        .login-footer {
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          font-weight: normal;
          font-style: normal;
          font-size: 13px;
          line-height: 18px;
          letter-spacing: 0;
          text-align: center;
          color: var(--base-muted-foreground, rgba(115, 115, 115, 1));
          opacity: 1;
        }

        .login-link {
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          font-weight: normal;
          font-style: normal;
          font-size: 13px;
          line-height: 18px;
          letter-spacing: 0;
          text-align: center;
          color: var(--base-muted-foreground, rgba(115, 115, 115, 1));
          text-decoration: underline;
          text-decoration-style: solid;
          text-underline-offset: 0px;
          text-decoration-thickness: 1px;
        }

        /* ── Responsive ────────────────────────────────── */
        @media (max-width: 640px) {
          .login-page {
            padding: 40px 16px 24px;
            height: 100vh;
            height: 100dvh;
            overflow-y: auto;
            overflow-x: hidden;
            align-items: flex-start;
          }

          .login-container {
            width: 100%;
            max-width: 100%;
          }

          .login-card {
            width: 100%;
            max-width: 100%;
            padding: 24px 18px;
            border-radius: 18px;
          }

          .login-heading {
            font-size: 20px;
          }

          .login-btn {
            height: 44px;
          }
        }
      `}</style>
    </main>
  );
}
