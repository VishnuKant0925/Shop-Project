'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../login/page.module.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
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
          <h3 className={styles.authHeadline}>Join our family!</h3>
          <p className={styles.authDesc}>
            Create an account to place orders, track deliveries, and enjoy exclusive offers.
          </p>
          <div className={styles.authFeatures}>
            <div className={styles.authFeature}>📦 Easy order placement</div>
            <div className={styles.authFeature}>🔔 Order status updates</div>
            <div className={styles.authFeature}>💰 Special member pricing</div>
            <div className={styles.authFeature}>🚚 Fast delivery tracking</div>
          </div>
        </div>

        <div className={styles.authRight}>
          <form className={styles.authForm} onSubmit={handleSubmit}>
            <h1 className={styles.formTitle}>Create Account</h1>
            <p className={styles.formSubtitle}>
              Already have an account?{' '}
              <Link href="/auth/login" className={styles.formLink}>Login here</Link>
            </p>

            <div className={styles.inputGroup}>
              <label htmlFor="register-name">Full Name</label>
              <input
                id="register-name"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="register-email">Email Address</label>
              <input
                id="register-email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="register-phone">Phone Number</label>
              <input
                id="register-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                placeholder="Create a password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="register-confirm">Confirm Password</label>
              <input
                id="register-confirm"
                type="password"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                'Create Account'
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
