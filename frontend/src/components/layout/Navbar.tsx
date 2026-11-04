'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { api, Notification } from '@/lib/api';
import { siteConfig } from '@/lib/site';
import { getSocket } from '@/lib/socket';
import ThemeToggle from './ThemeToggle';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Store' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
];

export const isActivePath = (pathname: string | null, href: string) =>
  href === '/' ? pathname === '/' : !!pathname?.startsWith(href);

const notificationIcons: Record<string, string> = {
  new_order: '🛒',
  order_ready: '🎉',
  order_status_changed: '📦',
  payment_uploaded: '💳',
  order_cancelled: '❌',
  new_enquiry: '📞',
};

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifOpenRef = useRef(false);

  // User dropdown state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notifOpenRef.current = notifOpen;
  }, [notifOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click / Escape
  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      setUnreadCount(await api.getUnreadCount());
    } catch {
      // Silently fail
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await api.getNotifications(1, 10);
      setNotifications(res.data);
    } catch {
      // Silently fail
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Socket connection for real-time notifications
  useEffect(() => {
    if (!user) return;

    api.getUnreadCount().then(setUnreadCount).catch(() => undefined);

    const socket = getSocket();
    const handleNew = () => {
      void fetchUnreadCount();
      if (notifOpenRef.current) void loadNotifications();
    };
    socket.on('notification:new', handleNew);

    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [user, fetchUnreadCount, loadNotifications]);

  const handleNotifToggle = () => {
    if (!notifOpen) void loadNotifications();
    setNotifOpen(!notifOpen);
    setUserMenuOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Silently fail
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      // Silently fail
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.headerInner}>
        {/* Brand Identity */}
        <Link href="/" className={styles.brand} aria-label={`${siteConfig.name} — Home`}>
          <span className={styles.logoBox}>
            <Image
              src="/images/logo.jpeg"
              alt=""
              width={44}
              height={44}
              className={styles.logoImg}
              priority
            />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>New Pandit</span>
            <span className={styles.brandTagline}>Masala &amp; Tel Mill</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main">
          {navLinks.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <a href={`tel:${siteConfig.phones[0]}`} className={`${styles.iconBtn} ${styles.mobileOnly}`} aria-label="Call the mill">
            <span className="material-symbols-outlined" aria-hidden="true">call</span>
          </a>

          <ThemeToggle />

          <Link href="/cart" className={`${styles.iconBtn} ${styles.desktopOnly}`} aria-label={`Cart, ${totalItems} items`}>
            <span className="material-symbols-outlined" aria-hidden="true">shopping_basket</span>
            {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
          </Link>

          {/* Notification Bell (for logged-in users) */}
          {user && (
            <div className={styles.notifContainer} ref={notifRef}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={handleNotifToggle}
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={notifOpen}
              >
                <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
                {unreadCount > 0 && (
                  <span className={`${styles.badge} ${styles.badgeAlert}`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button type="button" className={styles.notifMarkAll} onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className={styles.notifList}>
                    {notifLoading ? (
                      <div className={styles.notifEmpty}>Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className={styles.notifEmpty}>No notifications yet</div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          type="button"
                          key={n.id}
                          className={`${styles.notifItem} ${!n.isRead ? styles.notifItemUnread : ''}`}
                          onClick={() => !n.isRead && handleMarkRead(n.id)}
                        >
                          <span className={styles.notifItemIcon} aria-hidden="true">
                            {notificationIcons[n.type] || '🔔'}
                          </span>
                          <span className={styles.notifItemContent}>
                            <span className={styles.notifItemTitle}>{n.title}</span>
                            <span className={styles.notifItemMsg}>{n.message}</span>
                            <span className={styles.notifItemTime}>{formatTimeAgo(n.createdAt)}</span>
                          </span>
                          {!n.isRead && <span className={styles.notifDot} />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin Panel Link (admin only) */}
          {user?.role === 'admin' && (
            <Link href="/admin" className={styles.adminPanelBtn} aria-label="Admin panel">
              <span className="material-symbols-outlined" aria-hidden="true">admin_panel_settings</span>
              <span className={styles.adminPanelLabel}>Admin</span>
            </Link>
          )}

          {user ? (
            <div className={`${styles.userMenuContainer} ${styles.desktopOnly}`} ref={userMenuRef}>
              <button
                type="button"
                className={styles.userBtn}
                onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <span className={styles.avatar} aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
                <span className={styles.userName}>{user.name.split(' ')[0]}</span>
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px', opacity: 0.6 }}>
                  expand_more
                </span>
              </button>

              {userMenuOpen && (
                <div className={styles.userDropdown} role="menu">
                  <div className={styles.userDropdownHeader}>
                    <div className={styles.userDropdownName}>{user.name}</div>
                    <div className={styles.userDropdownEmail}>{user.email}</div>
                  </div>
                  <div className={styles.userDropdownDivider} />
                  <Link href="/profile" role="menuitem" className={styles.userDropdownLink} onClick={() => setUserMenuOpen(false)}>
                    <span className="material-symbols-outlined" aria-hidden="true">person</span>
                    My Profile
                  </Link>
                  <Link href="/orders" role="menuitem" className={styles.userDropdownLink} onClick={() => setUserMenuOpen(false)}>
                    <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                    My Orders
                  </Link>
                  <div className={styles.userDropdownDivider} />
                  <button type="button" role="menuitem" className={styles.userDropdownLink} onClick={handleLogout}>
                    <span className="material-symbols-outlined" aria-hidden="true">logout</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className={`${styles.loginBtn} ${styles.desktopOnly}`}>
              <span className="material-symbols-outlined" aria-hidden="true">account_circle</span>
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
