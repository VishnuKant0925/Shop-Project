'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Order } from '@/types';
import styles from './page.module.css';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (isoString: string): string => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
  paid: { bg: '#DBEAFE', text: '#1E40AF', dot: '#2563EB' },
  preparing: { bg: '#EDE9FE', text: '#5B21B6', dot: '#7C3AED' },
  ready: { bg: '#DCFCE7', text: '#166534', dot: '#16A34A' },
  completed: { bg: '#F3F4F6', text: '#374151', dot: '#6B7280' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' },
};

export default function ProfilePage() {
  const { user, isLoading, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');

      api.getMyOrders()
        .then((data) => setOrders(data))
        .catch(() => setOrders([]))
        .finally(() => setLoadingOrders(false));
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const updateData: { name?: string; phone?: string; password?: string } = {};

      if (name.trim() !== user.name) updateData.name = name.trim();
      if (phone.trim() !== (user.phone || '')) updateData.phone = phone.trim();

      if (showPasswordSection && newPassword) {
        if (newPassword.length < 6) {
          setError('Password must be at least 6 characters.');
          setIsSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match.');
          setIsSaving(false);
          return;
        }
        updateData.password = newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        setMessage('No changes to save.');
        setIsSaving(false);
        return;
      }

      await api.updateProfile(updateData);
      refreshUser();
      setMessage('Profile updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getInitials = (userName: string) => {
    return (userName || 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  const completedOrders = orders.filter((o) =>
    ['paid', 'preparing', 'ready', 'completed'].includes(o.status)
  );
  const totalSpend = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const recentOrders = orders.slice(0, 3);

  return (
    <div className={styles.pageWrap}>
      <div className={styles.container}>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb}>
          <Link href="/" className={styles.breadcrumbLink}>Home</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>My Account Profile</span>
        </nav>

        {/* Page Title & Intro */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Account Dashboard</h1>
            <p className={styles.pageSubtitle}>
              Manage your personal credentials, review purchases, and keep your contact info current.
            </p>
          </div>
          {user.role === 'admin' && (
            <Link href="/admin" className={styles.adminConsoleBtn}>
              <span>⚙️</span>
              <span>Open Admin Panel →</span>
            </Link>
          )}
        </div>

        {/* 2-Column Responsive Layout */}
        <div className={styles.dashboardGrid}>
          {/* Left Column: Account Profile Sidebar */}
          <aside className={styles.sidebarColumn}>
            {/* Identity Card */}
            <div className={styles.identityCard}>
              <div className={styles.identityHeader}>
                <div className={styles.avatarLarge}>
                  {getInitials(user.name)}
                </div>
                <div className={styles.identityMeta}>
                  <h2 className={styles.userName}>{user.name}</h2>
                  <p className={styles.userEmail}>{user.email}</p>
                  <div className={styles.badgeRow}>
                    <span className={user.role === 'admin' ? styles.adminBadge : styles.customerBadge}>
                      {user.role === 'admin' ? '👑 Administrator' : '👤 Verified Patron'}
                    </span>
                    <span className={styles.activeDotBadge}>
                      <span className={styles.greenDot} /> Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Profile Meta */}
              <div className={styles.identityDetails}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Mobile Helpline</span>
                  <span className={styles.metaValue}>
                    {user.phone || '+91 9934787476'}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Mill Yard Region</span>
                  <span className={styles.metaValue}>Lalganj 844121, Bihar</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Total Store Orders</span>
                  <span className={styles.metaValue}>{orders.length} placed</span>
                </div>
              </div>

              {/* Action Links */}
              <div className={styles.quickNav}>
                <Link href="/orders" className={styles.quickNavLink}>
                  <span>📦</span>
                  <span>Order History &amp; Receipts</span>
                  <span className={styles.navArrow}>→</span>
                </Link>
                <Link href="/cart" className={styles.quickNavLink}>
                  <span>🛒</span>
                  <span>My Active Shopping Basket</span>
                  <span className={styles.navArrow}>→</span>
                </Link>
                <Link href="/services" className={styles.quickNavLink}>
                  <span>⚙️</span>
                  <span>Milling &amp; Chakki Rates</span>
                  <span className={styles.navArrow}>→</span>
                </Link>
              </div>

              {/* Sign Out Action */}
              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutBtn}
              >
                <span>🚪</span>
                <span>Sign Out of Account</span>
              </button>
            </div>

            {/* Mill Support Helpdesk Card */}
            <div className={styles.supportCard}>
              <div className={styles.supportTop}>
                <span className={styles.supportIcon}>🌶️</span>
                <div>
                  <h4 className={styles.supportTitle}>Need Mill Assistance?</h4>
                  <p className={styles.supportSub}>Directly contact our manager for live rate enquiries or custom bulk batches.</p>
                </div>
              </div>
              <div className={styles.supportActions}>
                <a href="tel:+919934787476" className={styles.supportCallBtn}>
                  📞 Call +91 9934787476
                </a>
                <a
                  href="https://wa.me/919934787476"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.supportWaBtn}
                >
                  💬 WhatsApp Mill
                </a>
              </div>
            </div>
          </aside>

          {/* Right Column: Main Form & Recent Activity */}
          <main className={styles.contentColumn}>
            {/* KPI Metric Summary Strip */}
            <div className={styles.kpiRow}>
              <div className={styles.kpiCard}>
                <span className={styles.kpiIcon}>📦</span>
                <div className={styles.kpiInfo}>
                  <span className={styles.kpiLabel}>Total Orders</span>
                  <strong className={styles.kpiValue}>{orders.length}</strong>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiIcon}>💰</span>
                <div className={styles.kpiInfo}>
                  <span className={styles.kpiLabel}>Cumulative Value</span>
                  <strong className={styles.kpiValue}>{formatCurrency(totalSpend)}</strong>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiIcon}>📍</span>
                <div className={styles.kpiInfo}>
                  <span className={styles.kpiLabel}>Dispatch Station</span>
                  <strong className={styles.kpiValue}>Lalganj Hub</strong>
                </div>
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className={styles.successMsg}>
                <span>✅</span>
                <p>{message}</p>
              </div>
            )}
            {error && (
              <div className={styles.errorMsg}>
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {/* Personal Details Form Card */}
            <div className={styles.formCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>Personal Information</h3>
                  <p className={styles.cardSub}>Update your contact profile for order tracking and invoices</p>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="profile-name">
                      Full Name <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <span className={styles.fieldIcon}>👤</span>
                      <input
                        id="profile-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isSaving}
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="profile-phone">Phone Number</label>
                    <div className={styles.inputWrapper}>
                      <span className={styles.fieldIcon}>📞</span>
                      <input
                        id="profile-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9934787476"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label htmlFor="profile-email">
                      Email Address <span className={styles.badgeVerified}>Verified</span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <span className={styles.fieldIcon}>✉️</span>
                      <input
                        id="profile-email"
                        type="email"
                        value={user.email}
                        disabled
                        className={styles.disabledInput}
                      />
                    </div>
                    <small className={styles.helpText}>
                      Primary login identifier. Connected to Google and password recovery.
                    </small>
                  </div>
                </div>

                {/* Password Section */}
                <div className={styles.securitySection}>
                  <div className={styles.securityHeader}>
                    <div>
                      <h4 className={styles.securityTitle}>Account Security &amp; Password</h4>
                      <p className={styles.securitySub}>
                        Keep your mill account safe with a strong, unique password.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.togglePasswordBtn}
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                    >
                      {showPasswordSection ? '✕ Cancel' : '🔑 Change Password'}
                    </button>
                  </div>

                  {showPasswordSection && (
                    <div className={styles.passwordFields}>
                      <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                          <label htmlFor="new-password">New Password</label>
                          <div className={styles.inputWrapper}>
                            <span className={styles.fieldIcon}>🔒</span>
                            <input
                              id="new-password"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Minimum 6 characters"
                              disabled={isSaving}
                              minLength={6}
                            />
                          </div>
                        </div>

                        <div className={styles.inputGroup}>
                          <label htmlFor="confirm-password">Confirm Password</label>
                          <div className={styles.inputWrapper}>
                            <span className={styles.fieldIcon}>🔒</span>
                            <input
                              id="confirm-password"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Re-type new password"
                              disabled={isSaving}
                            />
                          </div>
                        </div>
                      </div>
                      <small className={styles.passwordHint}>
                        Tip: Use at least 6 letters, numbers, and special characters.
                      </small>
                    </div>
                  )}
                </div>

                {/* Form Footer Actions */}
                <div className={styles.formFooter}>
                  <button
                    type="submit"
                    className={styles.saveChangesBtn}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className={styles.btnSpinner} />
                        <span>Saving Updates...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Orders Overview Card */}
            <div className={styles.ordersSnapshotCard}>
              <div className={styles.ordersSnapshotHeader}>
                <div>
                  <h3 className={styles.cardTitle}>Recent Orders</h3>
                  <p className={styles.cardSub}>Your latest purchases from New Pandit Mill</p>
                </div>
                <Link href="/orders" className={styles.viewAllOrdersLink}>
                  View All Orders ({orders.length}) →
                </Link>
              </div>

              {loadingOrders ? (
                <div className={styles.ordersLoading}>
                  <div className={styles.miniSpinner} />
                  <span>Loading recent orders...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className={styles.noOrdersBox}>
                  <span style={{ fontSize: '2rem' }}>🛍️</span>
                  <div>
                    <strong>No orders placed yet</strong>
                    <p>Experience 100% pure cold-pressed oils and slow stone-ground spices.</p>
                  </div>
                  <Link href="/products" className={styles.shopNowBtn}>
                    Explore Products →
                  </Link>
                </div>
              ) : (
                <div className={styles.recentOrdersList}>
                  {recentOrders.map((order) => {
                    const statusConf = statusColors[order.status] || {
                      bg: '#F3F4F6',
                      text: '#374151',
                      dot: '#6B7280',
                    };
                    return (
                      <div key={order.id} className={styles.recentOrderItem}>
                        <div className={styles.orderTopLine}>
                          <span className={styles.orderNum}>{order.orderNumber}</span>
                          <span
                            className={styles.statusBadge}
                            style={{
                              backgroundColor: statusConf.bg,
                              color: statusConf.text,
                            }}
                          >
                            <span
                              className={styles.statusDot}
                              style={{ backgroundColor: statusConf.dot }}
                            />
                            {order.status}
                          </span>
                        </div>
                        <div className={styles.orderSummaryLine}>
                          <span className={styles.orderItemCount}>
                            {order.items.length} item{order.items.length === 1 ? '' : 's'}:{' '}
                            {order.items.map((i) => i.productName).join(', ')}
                          </span>
                          <strong className={styles.orderCost}>
                            {formatCurrency(order.total)}
                          </strong>
                        </div>
                        <div className={styles.orderDateLine}>
                          <span>Placed on {formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
