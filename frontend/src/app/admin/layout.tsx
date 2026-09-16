'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './layout.module.css';

const navItems = [
  { href: '/admin', icon: '📊', label: 'Dashboard' },
  { href: '/admin/products', icon: '📦', label: 'Products' },
  { href: '/admin/orders', icon: '🛒', label: 'Orders' },
  { href: '/admin/services', icon: '⚙️', label: 'Services' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loading state while auth is resolving
  if (isLoading) {
    return (
      <div className={styles.adminLayout}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect non-authenticated users to login
  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/auth/login');
    }
    return null;
  }

  // Show access denied for non-admin users
  if (user.role !== 'admin') {
    return (
      <div className={styles.adminLayout}>
        <div className={styles.accessDenied}>
          <span className={styles.accessDeniedIcon}>🔒</span>
          <h2>Access Denied</h2>
          <p>You don&apos;t have administrator privileges to access this panel.</p>
          <Link href="/" className={styles.backHomeBtn}>Go Back Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarLogo}>🌶️</span>
          <div>
            <h3 className={styles.sidebarBrand}>Admin Panel</h3>
            <p className={styles.sidebarBrandSub}>New Pandit Masala</p>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.sidebarLink} ${pathname === item.href ? styles.sidebarLinkActive : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.sidebarIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.backToSite}>
            ← Back to Website
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <header className={styles.topBar}>
          <button
            className={styles.menuToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className={styles.topBarRight}>
            <span className={styles.adminBadge}>👤 {user.name.split(' ')[0]}</span>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
