import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerWave}>
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path
            d="M0,40 C360,100 720,0 1080,60 C1260,90 1380,40 1440,50 L1440,100 L0,100 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className={`${styles.footerContent} container`}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <div className={styles.brandLogo}>
              <span className={styles.brandIcon}>🌶️</span>
              <div>
                <h3 className={styles.brandName}>New Pandit</h3>
                <p className={styles.brandTag}>Masala & Tel Mill</p>
              </div>
            </div>
            <p className={styles.brandDesc}>
              Bringing you the finest quality spices and pure cold-pressed oils since generations.
              Traditional taste, modern quality.
            </p>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.colTitle}>Quick Links</h4>
            <ul className={styles.colLinks}>
              <li><Link href="/products">Our Products</Link></li>
              <li><Link href="/services">Our Services</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/cart">Shopping Cart</Link></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.colTitle}>Products</h4>
            <ul className={styles.colLinks}>
              <li><Link href="/products/red-chili-powder">Red Chili Powder</Link></li>
              <li><Link href="/products/turmeric-powder">Turmeric Powder</Link></li>
              <li><Link href="/products/coriander-powder">Coriander Powder</Link></li>
              <li><Link href="/products/mustard-oil">Mustard Oil</Link></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.colTitle}>Contact</h4>
            <ul className={styles.colInfo}>
              <li>
                <span className={styles.infoIcon}>📍</span>
                <span>Main Market Road,<br />Your City, India</span>
              </li>
              <li>
                <span className={styles.infoIcon}>📞</span>
                <span>+91 98765 43210</span>
              </li>
              <li>
                <span className={styles.infoIcon}>✉️</span>
                <span>info@newpanditmasala.com</span>
              </li>
              <li>
                <span className={styles.infoIcon}>🕐</span>
                <span>Mon-Sat: 8AM - 8PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} New Pandit Masala & Tel Mill. All rights reserved.</p>
          <div className={styles.footerBottomLinks}>
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
