'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { totalItems } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={`${styles.nav} container`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🌶️</span>
          <div className={styles.logoText}>
            <span className={styles.logoName}>New Pandit</span>
            <span className={styles.logoTagline}>Masala & Tel Mill</span>
          </div>
        </Link>

        <ul className={`${styles.navLinks} ${mobileOpen ? styles.navLinksOpen : ''}`}>
          <li><Link href="/" className={styles.navLink} onClick={() => setMobileOpen(false)}>Home</Link></li>
          <li><Link href="/products" className={styles.navLink} onClick={() => setMobileOpen(false)}>Products</Link></li>
          <li><Link href="/services" className={styles.navLink} onClick={() => setMobileOpen(false)}>Services</Link></li>
          <li><Link href="/contact" className={styles.navLink} onClick={() => setMobileOpen(false)}>Contact</Link></li>
          <li className={styles.mobileOnly}>
            <Link href="/auth/login" className={styles.navLink} onClick={() => setMobileOpen(false)}>Login</Link>
          </li>
        </ul>

        <div className={styles.navActions}>
          <Link href="/cart" className={styles.cartBtn} aria-label="Shopping Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {totalItems > 0 && (
              <span className={styles.cartBadge}>{totalItems}</span>
            )}
          </Link>

          <Link href="/auth/login" className={styles.loginBtn}>
            Login
          </Link>

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
      </nav>

      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />
      )}
    </header>
  );
}
