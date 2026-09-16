'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './layout.module.css';

const navItems = [
  { href: '/admin', icon: '📊', label: 'Dashboard', badge: null },
  { href: '/admin/products', icon: '📦', label: 'Products & Stock', badge: null },
  { href: '/admin/orders', icon: '🛒', label: 'Customer Orders', badge: null },
  { href: '/admin/services', icon: '⚙️', label: 'Mill Services', badge: null },
  { href: '/admin/customers', icon: '👥', label: 'Customers & CRM', badge: null },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Redirect non-authenticated users to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Show loading state while auth is resolving or redirecting
  if (isLoading || !user) {
    return (
      <div className={styles.adminLayout}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Verifying admin session...</p>
        </div>
      </div>
    );
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

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard Overview';
    if (pathname.startsWith('/admin/products')) return 'Product & Inventory Management';
    if (pathname.startsWith('/admin/orders')) return 'Order Fulfillment & Review';
    if (pathname.startsWith('/admin/services')) return 'Milling & Expelling Services';
    if (pathname.startsWith('/admin/customers')) return 'Customer Directory & CRM';
    return 'Admin Panel';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        {/* Brand Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <Image
              src="/images/logo.jpeg"
              alt="New Pandit Mill"
              width={40}
              height={40}
              className={styles.logoImage}
              priority
            />
          </div>
          <div className={styles.brandInfo}>
            <h3 className={styles.sidebarBrand}>New Pandit Mill</h3>
            <div className={styles.sidebarBrandSub}>
              <span className={styles.onlineDot} />
              <span>Admin Console</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.sidebarNav}>
          <span className={styles.navSectionLabel}>Core Management</span>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.sidebarIcon}>{item.icon}</span>
                <span className={styles.sidebarLabel}>{item.label}</span>
                {item.badge && <span className={styles.linkBadge}>{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.backToSite} title="Open customer website in new tab" target="_blank" rel="noopener noreferrer">
            <span>🌐</span>
            <span>View Public Store</span>
            <span className={styles.externalArrow}>↗</span>
          </Link>

          <div className={styles.adminUserCard}>
            <div className={styles.adminUserAvatar}>
              {getInitials(user.name) || 'A'}
            </div>
            <div className={styles.adminUserInfo}>
              <span className={styles.adminUserName}>{user.name}</span>
              <span className={styles.adminUserRole}>Super Admin</span>
            </div>
            <button
              onClick={handleLogout}
              className={styles.logoutBtn}
              title="Sign Out"
              aria-label="Sign out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Layout Content */}
      <div className={styles.mainContent}>
        {/* Sticky Modern TopBar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              className={styles.menuToggle}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbRoot}>Admin</span>
              <span className={styles.breadcrumbSep}>/</span>
              <span className={styles.breadcrumbCurrent}>{getPageTitle()}</span>
            </div>
          </div>

          <div className={styles.topBarRight}>
            <div className={styles.systemStatusPill}>
              <span className={styles.statusPillDot} />
              <span>Mill Systems Online</span>
            </div>

            <Link href="/" className={styles.storeLinkBtn} target="_blank" rel="noopener noreferrer">
              <span>View Storefront</span>
              <span style={{ fontSize: '13px' }}>↗</span>
            </Link>

            <div className={styles.adminProfileWrap}>
              <button
                className={styles.adminProfileBtn}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-label="User menu"
              >
                <div className={styles.topAvatar}>{getInitials(user.name) || 'A'}</div>
                <div className={styles.topAdminMeta}>
                  <span className={styles.topAdminName}>{user.name.split(' ')[0]}</span>
                  <span className={styles.topAdminRole}>Admin</span>
                </div>
                <span className={styles.dropdownCaret}>▾</span>
              </button>

              {userDropdownOpen && (
                <>
                  <div className={styles.dropdownBackdrop} onClick={() => setUserDropdownOpen(false)} />
                  <div className={styles.adminDropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                      <span className={styles.phoneBadge}>{user.phone || '+91 9934787476'}</span>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <Link href="/" className={styles.dropdownItem} onClick={() => setUserDropdownOpen(false)}>
                      <span>🌐</span> Public Storefront
                    </Link>
                    <Link href="/profile" className={styles.dropdownItem} onClick={() => setUserDropdownOpen(false)}>
                      <span>👤</span> My Account Profile
                    </Link>
                    <div className={styles.dropdownDivider} />
                    <button onClick={handleLogout} className={styles.dropdownLogoutBtn}>
                      <span>🚪</span> Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>

      {/* Backdrop for Mobile */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
