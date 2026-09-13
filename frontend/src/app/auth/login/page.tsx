'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { User } from '@/types';
import styles from './page.module.css';

type LoginMethod = 'password' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [otpCode, setOtpCode] = useState('');
  const [method, setMethod] = useState<LoginMethod>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const completeLogin = useCallback((user: User) => {
    refreshUser();
    router.push(user.role === 'admin' ? '/admin' : '/products');
  }, [refreshUser, router]);

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await api.login(form);
      completeLogin(result.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await api.requestLoginOtp(form.email);
      setOtpSent(true);
      setMessage(result.message || 'A six-digit sign-in code has been sent to your email.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send a sign-in code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await api.verifyLoginOtp(form.email, otpCode);
      completeLogin(result.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to verify the sign-in code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await api.loginWithGoogle(credential);
      completeLogin(result.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [completeLogin]);

  const handleGoogleError = useCallback((nextError: string) => {
    setError(nextError);
  }, []);

  const switchMethod = (nextMethod: LoginMethod) => {
    setMethod(nextMethod);
    setOtpSent(false);
    setOtpCode('');
    setError('');
    setMessage('');
  };

  const otpForm = otpSent ? handleVerifyOtp : handleSendOtp;

  return (
    <div className={styles.page}>
      <div className={styles.authContainer}>
        {/* Left Side: Animated Shop Name & 2 Images Showcase */}
        <div className={styles.authLeft}>
          <div className={styles.authLeftInner}>
            {/* Only Animated Shop Name */}
            <div className={styles.onlyShopNameBrand}>
              <div className={styles.brandGlowAura} />
              <span className={styles.shopMainName}>New Pandit</span>
              <div className={styles.shopNameDivider}>
                <span className={styles.dividerLine} />
                <span className={styles.dividerDiamond}>◆</span>
                <span className={styles.dividerLine} />
              </div>
              <span className={styles.shopCategoryName}>Masala &amp; Tel Mill</span>
            </div>

            {/* 2 Images Showcase */}
            <div className={styles.imageShowcase}>
              <div className={styles.imageFrame}>
                <img
                  src="/images/login1.png"
                  alt="New Pandit Pure Stone-Ground Spices"
                  className={styles.showcaseImage}
                />
              </div>
              <div className={styles.imageFrame}>
                <img
                  src="/images/login2.png"
                  alt="New Pandit Traditional Chakki & Oil Mill"
                  className={styles.showcaseImage}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Login Form */}
        <div className={styles.authRight}>
          {/* Mobile brand header */}
          <div className={styles.mobileBrandHeader}>
            <div className={styles.mobileBrandLogo}>🌶️</div>
            <div className={styles.mobileBrandTitles}>
              <h3>New Pandit</h3>
              <p>Masala &amp; Tel Mill</p>
            </div>
          </div>

          <form className={styles.authForm} onSubmit={method === 'password' ? handlePasswordLogin : otpForm}>
            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>Welcome back</h1>
              <p className={styles.formSubtitle}>
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" className={styles.formLink}>
                  Register here &rarr;
                </Link>
              </p>
            </div>

            {/* Modern Tab Selector for Login Method */}
            <div className={styles.methodTabs}>
              <button
                type="button"
                className={`${styles.methodTab} ${method === 'password' ? styles.methodTabActive : ''}`}
                onClick={() => switchMethod('password')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Password</span>
              </button>

              <button
                type="button"
                className={`${styles.methodTab} ${method === 'otp' ? styles.methodTabActive : ''}`}
                onClick={() => switchMethod('otp')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>Email OTP</span>
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className={`${styles.alert} ${styles.alertError}`} role="alert">
                <svg className={styles.alertIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>{error}</div>
              </div>
            )}

            {/* Success Notification */}
            {message && (
              <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
                <svg className={styles.alertIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div>{message}</div>
              </div>
            )}

            {/* Email Field */}
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="login-email">Email Address</label>
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.fieldIcon}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                  autoComplete="email"
                  disabled={loading || (method === 'otp' && otpSent)}
                />
              </div>
            </div>

            {method === 'password' ? (
              <>
                {/* Password Field with Show/Hide Toggle */}
                <div className={styles.inputGroup}>
                  <div className={styles.labelRow}>
                    <label htmlFor="login-password">Password</label>
                  </div>
                  <div className={styles.inputWrapper}>
                    <span className={styles.fieldIcon}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      required
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className={styles.eyeToggleBtn}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? (
                    <span className={styles.spinner} />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* OTP Verification Field */}
                {otpSent && (
                  <div className={styles.inputGroup}>
                    <div className={styles.labelRow}>
                      <label htmlFor="login-otp">Six-digit Verification Code</label>
                    </div>
                    <div className={styles.inputWrapper}>
                      <span className={styles.fieldIcon}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="M7 15h.01M12 15h.01M17 15h.01M7 11h.01M12 11h.01M17 11h.01" />
                        </svg>
                      </span>
                      <input
                        id="login-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        placeholder="123456"
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                        required
                        disabled={loading}
                        style={{ letterSpacing: '0.25em', fontWeight: '700', fontSize: '1.1rem' }}
                      />
                    </div>
                  </div>
                )}

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? (
                    <span className={styles.spinner} />
                  ) : (
                    <>
                      <span>{otpSent ? 'Verify Code & Sign In' : 'Send 6-Digit OTP Code'}</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>

                {otpSent && (
                  <div className={styles.subActionWrap}>
                    <button
                      type="button"
                      className={styles.textBtn}
                      onClick={() => switchMethod('otp')}
                      disabled={loading}
                    >
                      &larr; Use a different email or request a new code
                    </button>
                  </div>
                )}
              </>
            )}

            <div className={styles.divider}>
              <span>or sign in with</span>
            </div>

            <GoogleSignInButton onCredential={handleGoogleCredential} onError={handleGoogleError} />

            <Link href="/" className={styles.guestBtn}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Continue as Guest</span>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
