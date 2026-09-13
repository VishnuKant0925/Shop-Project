'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import styles from '../login/page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match! Please check and try again.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await api.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      refreshUser();
      router.push('/products');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setError('');
    setLoading(true);
    try {
      await api.loginWithGoogle(credential);
      refreshUser();
      router.push('/products');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [refreshUser, router]);

  const handleGoogleError = useCallback((nextError: string) => {
    setError(nextError);
  }, []);

  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

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

            {/* 3 Images Showcase (Register Page) */}
            <div className={`${styles.imageShowcase} ${styles.imageShowcaseThree}`}>
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
              <div className={styles.imageFrame}>
                <img
                  src="/images/login3.png"
                  alt="New Pandit Aromatic Spice Grinding"
                  className={styles.showcaseImage}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className={styles.authRight}>
          {/* Mobile brand header */}
          <div className={styles.mobileBrandHeader}>
            <div className={styles.mobileBrandLogo}>🌶️</div>
            <div className={styles.mobileBrandTitles}>
              <h3>New Pandit</h3>
              <p>Masala &amp; Tel Mill</p>
            </div>
          </div>

          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>Create Account</h1>
              <p className={styles.formSubtitle}>
                Already have an account?{' '}
                <Link href="/auth/login" className={styles.formLink}>
                  Login here &rarr;
                </Link>
              </p>
            </div>

            {/* Error Banner */}
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

            {/* Full Name */}
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="register-name">Full Name</label>
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.fieldIcon}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="register-name"
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Address */}
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="register-email">Email Address</label>
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.fieldIcon}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="register-phone">Phone Number</label>
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.fieldIcon}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <input
                  id="register-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="register-password">Password</label>
                <span className={styles.optionalTag}>Min 6 characters</span>
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.fieldIcon}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="register-confirm">Confirm Password</label>
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.fieldIcon}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <input
                  id="register-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.eyeToggleBtn}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
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

              {passwordsMatch && (
                <div className={`${styles.matchIndicator} ${styles.matchSuccess}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Passwords match</span>
                </div>
              )}
              {passwordsMismatch && (
                <div className={`${styles.matchIndicator} ${styles.matchWarning}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Passwords do not match</span>
                </div>
              )}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                <>
                  <span>Create Account</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>

            <div className={styles.divider}>
              <span>or sign up with</span>
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
