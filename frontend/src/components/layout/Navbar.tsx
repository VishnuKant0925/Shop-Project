'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { api, Notification } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Store' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
];

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // User dropdown state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await api.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silently fail
    }
  }, [user]);

  // Socket connection for real-time notifications
  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    fetchUnreadCount();

    const socket: Socket = io(SOCKET_URL, { transports: ['polling', 'websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', user.id);
      if (user.role === 'admin') {
        socket.emit('join-admin');
      }
    });

    socket.on('notification:new', () => {
      fetchUnreadCount();
      // If dropdown is open, refresh it
      if (notifOpen) {
        loadNotifications();
      }
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await api.getNotifications(1, 10);
      setNotifications(res.data);
    } catch {
      // Silently fail
    } finally {
      setNotifLoading(false);
    }
  };

  const handleNotifToggle = () => {
    if (!notifOpen) {
      loadNotifications();
    }
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
    setMobileOpen(false);
    setUserMenuOpen(false);
    router.push('/');
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

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.headerInner}>
        {/* Brand Identity */}
        <Link href="/" className={styles.brand}>
          <div className={styles.logoBox}>
            <Image
              src="/images/logo.jpeg"
              alt="New Pandit Logo"
              width={44}
              height={44}
              className={styles.logoImg}
              priority
            />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>New Pandit</span>
            <span className={styles.brandTagline}>Masala &amp; Tel Mill</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.navLink}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Cart Button */}
          <Link href="/cart" className={styles.cartBtn} aria-label="Shopping Cart">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              shopping_basket
            </span>
            {totalItems > 0 && (
              <span className={styles.cartBadge}>{totalItems}</span>
            )}
          </Link>

          {/* Notification Bell (for logged-in users) */}
          {user && (
            <div className={styles.notifContainer} ref={notifRef}>
              <button
                type="button"
                className={styles.notifBtn}
                onClick={handleNotifToggle}
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span className={styles.notifBadge}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className={styles.notifMarkAll}
                        onClick={handleMarkAllRead}
                      >
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
                        <div
                          key={n.id}
                          className={`${styles.notifItem} ${!n.isRead ? styles.notifItemUnread : ''}`}
                          onClick={() => !n.isRead && handleMarkRead(n.id)}
                        >
                          <div className={styles.notifItemIcon}>
                            {n.type === 'new_order' ? '🛒' :
                             n.type === 'order_ready' ? '🎉' :
                             n.type === 'order_status_changed' ? '📦' : '🔔'}
                          </div>
                          <div className={styles.notifItemContent}>
                            <div className={styles.notifItemTitle}>{n.title}</div>
                            <div className={styles.notifItemMsg}>{n.message}</div>
                            <div className={styles.notifItemTime}>{formatTimeAgo(n.createdAt)}</div>
                          </div>
                          {!n.isRead && <div className={styles.notifDot} />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin Panel Link (admin only) */}
          {user?.role === 'admin' && (
            <Link href="/admin" className={styles.adminPanelBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                admin_panel_settings
              </span>
              <span>Admin Panel</span>
            </Link>
          )}

          {user ? (
            <div className={styles.userMenuContainer} ref={userMenuRef}>
              <button
                type="button"
                className={styles.userBtn}
                onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  account_circle
                </span>
                <span className={styles.userName}>{user.name.split(' ')[0]}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', opacity: 0.5 }}>
                  expand_more
                </span>
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className={styles.userDropdown}>
                  <div className={styles.userDropdownHeader}>
                    <div className={styles.userDropdownName}>{user.name}</div>
                    <div className={styles.userDropdownEmail}>{user.email}</div>
                  </div>
                  <div className={styles.userDropdownDivider} />
                  <Link
                    href="/profile"
                    className={styles.userDropdownLink}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                    My Profile
                  </Link>
                  <Link
                    href="/orders"
                    className={styles.userDropdownLink}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span>
                    My Orders
                  </Link>
                  <div className={styles.userDropdownDivider} />
                  <button
                    type="button"
                    className={styles.userDropdownLink}
                    onClick={handleLogout}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className={styles.adminBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-on-surface-variant)' }}>
                account_circle
              </span>
              <span>Login</span>
            </Link>
          )}

          {/* Mobile Hamburger */}
          <button
            className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <ul className={`${styles.mobileNav} ${mobileOpen ? styles.mobileNavOpen : ''}`}>
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={styles.mobileNavLink}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          </li>
        ))}
        {user?.role === 'admin' && (
          <li>
            <Link
              href="/admin"
              className={styles.mobileNavLink}
              onClick={() => setMobileOpen(false)}
            >
              ⚙️ Admin Panel
            </Link>
          </li>
        )}
        <li className={styles.mobileNavDivider}></li>
        {user ? (
          <>
            <li>
              <Link
                href="/profile"
                className={styles.mobileNavLink}
                onClick={() => setMobileOpen(false)}
              >
                👤 My Profile
              </Link>
            </li>
            <li>
              <Link
                href="/orders"
                className={styles.mobileNavLink}
                onClick={() => setMobileOpen(false)}
              >
                📦 My Orders
              </Link>
            </li>
            <li className={styles.mobileNavDivider}></li>
            <li>
              <button className={styles.mobileNavButton} onClick={handleLogout}>
                Logout ({user.name.split(' ')[0]})
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link
              href="/auth/login"
              className={styles.mobileNavLink}
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
          </li>
        )}
      </ul>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />
      )}
    </header>
  );
}
