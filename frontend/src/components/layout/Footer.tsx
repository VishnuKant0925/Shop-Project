import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          {/* Col 1: Brand Info */}
          <div className={styles.brandCol}>
            <div className={styles.brandRow}>
              <div className={styles.brandLogoBox}>
                <Image
                  src="/images/logo.jpeg"
                  alt="New Pandit Logo"
                  width={32}
                  height={32}
                  className={styles.brandLogoImg}
                />
              </div>
              <span className={styles.brandColName}>New Pandit Mill</span>
            </div>
            <p className={styles.brandDesc}>
              Authentic wooden-kohlu cold-pressed oils and slow stone-ground spices since 1984. Zero adulteration guarantee.
            </p>
            <span className={styles.fssaiBadge}>
              FSSAI Lic. #10023948000122
            </span>
          </div>

          {/* Col 2: Products */}
          <div className={styles.footerCol}>
            <h4 className={styles.colTitle}>Our Pure Products</h4>
            <ul className={styles.colLinks}>
              <li><Link href="/products/mustard-oil">Kachi Ghani Mustard Oil</Link></li>
              <li><Link href="/products">Stone-Ground Turmeric &amp; Chilli</Link></li>
              <li><Link href="/products/coriander-powder">Coriander Powder</Link></li>
              <li><Link href="/products">Fresh Rolled Poha</Link></li>
            </ul>
          </div>

          {/* Col 3: Mill Yard & Hours */}
          <div className={styles.footerCol}>
            <h4 className={styles.colTitle}>Mill Yard &amp; Hours</h4>
            <p className={styles.colText}>
              Near Chhoti Mandi, Main Market Gate 2, Industrial Mill Zone
            </p>
            <p className={styles.colTextBold}>Mon - Sat: 7:00 AM - 8:30 PM</p>
            <p className={styles.colTextAccent}>Sunday: Bulk Wholesale Dispatch Only</p>
          </div>

          {/* Col 4: Contact & ERP */}
          <div className={styles.footerCol}>
            <h4 className={styles.colTitle}>Direct Helpdesk</h4>
            <p className={styles.colPhone}>+91 98765 43210</p>
            <p className={styles.colText}>
              Speak directly to the mill manager for live rate enquiries.
            </p>
            <Link href="/auth/login" className={styles.erpLink}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>lock</span>
              <span>Operator &amp; Staff ERP Login</span>
            </Link>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className={styles.copyright}>
          <p>© {new Date().getFullYear()} New Pandit Masala &amp; Tel Mill. All Rights Reserved.</p>
          <div className={styles.copyrightLinks}>
            <Link href="#">FSSAI Compliance</Link>
            <span>•</span>
            <Link href="#">Agmark Standard</Link>
            <span>•</span>
            <Link href="#">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
