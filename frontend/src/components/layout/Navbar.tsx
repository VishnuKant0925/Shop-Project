'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Store' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    router.push('/');
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

          {user ? (
            <>
              <span className={styles.userName}>Hi, {user.name.split(' ')[0]}</span>
              <button type="button" onClick={handleLogout} className={styles.adminBtn}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-on-surface-variant)' }}>
                  logout
                </span>
                <span>Logout</span>
              </button>
            </>
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
        <li className={styles.mobileNavDivider}></li>
        <li>
          {user ? (
            <button className={styles.mobileNavButton} onClick={handleLogout}>
              Logout ({user.name.split(' ')[0]})
            </button>
          ) : (
            <Link
              href="/auth/login"
              className={styles.mobileNavLink}
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
          )}
        </li>
      </ul>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />
      )}
    </header>
  );
}
