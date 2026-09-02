'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to backend auth API
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className={styles.page}>
      <div className={styles.authContainer}>
        <div className={styles.authLeft}>
          <div className={styles.authBrand}>
            <span className={styles.brandIcon}>🌶️</span>
            <h2>New Pandit</h2>
            <p>Masala & Tel Mill</p>
          </div>
          <h3 className={styles.authHeadline}>Welcome back!</h3>
          <p className={styles.authDesc}>
            Login to place orders, track deliveries, and manage your account.
          </p>
          <div className={styles.authFeatures}>
            <div className={styles.authFeature}>📦 Track your orders</div>
            <div className={styles.authFeature}>⚡ Quick checkout</div>
            <div className={styles.authFeature}>🎁 Exclusive offers</div>
          </div>
        </div>

        <div className={styles.authRight}>
          <form className={styles.authForm} onSubmit={handleSubmit}>
            <h1 className={styles.formTitle}>Login</h1>
            <p className={styles.formSubtitle}>
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className={styles.formLink}>Register here</Link>
            </p>

            <div className={styles.inputGroup}>
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                'Login'
              )}
            </button>

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <Link href="/" className={styles.guestBtn}>
              Continue as Guest
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
