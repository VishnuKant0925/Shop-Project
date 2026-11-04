'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPhone, telHref, useSettings } from '@/context/SettingsContext';
import styles from './Footer.module.css';

export default function Footer() {
  const { settings } = useSettings();
  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(`${settings.storeName}, ${settings.address}`);

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
                  alt=""
                  width={32}
                  height={32}
                  className={styles.brandLogoImg}
                />
              </div>
              <span className={styles.brandColName}>New Pandit Mill</span>
            </div>
            <p className={styles.brandDesc}>
              High-quality filtered cold-pressed oil and slow stone-ground spices since 1984. Zero adulteration guarantee.
            </p>
            <span className={styles.fssaiBadge}>
              FSSAI Lic. #10023948000122
            </span>
          </div>

          {/* Col 2: Products */}
          <nav className={styles.footerCol} aria-label="Products">
            <h2 className={styles.colTitle}>Our Pure Products</h2>
            <ul className={styles.colLinks}>
              <li><Link href="/products/mustard-oil">Kachi Ghani Mustard Oil</Link></li>
              <li><Link href="/products/turmeric-powder">Stone-Ground Turmeric Powder</Link></li>
              <li><Link href="/products/red-chili-powder">Red Chilli Powder</Link></li>
              <li><Link href="/products/coriander-powder">Coriander Powder</Link></li>
              <li><Link href="/services">Custom Milling Services</Link></li>
            </ul>
          </nav>

          {/* Col 3: Mill Yard & Hours */}
          <div className={styles.footerCol}>
            <h2 className={styles.colTitle}>Mill Yard &amp; Hours</h2>
            <address className={styles.colText}>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                {settings.address}
              </a>
            </address>
            <p className={styles.colTextBold}>{settings.hours}</p>
          </div>

          {/* Col 4: Contact */}
          <div className={styles.footerCol}>
            <h2 className={styles.colTitle}>Direct Helpdesk</h2>
            {settings.phones.map((phone) => (
              <a key={phone} href={telHref(phone)} className={styles.colPhone}>{formatPhone(phone)}</a>
            ))}
            <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className={styles.whatsappLink}>
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '16px' }}>chat</span>
              Chat on WhatsApp
            </a>
            <p className={styles.colText}>
              Speak directly to the mill manager for live rate enquiries.
            </p>
            <Link href="/auth/login" className={styles.erpLink}>
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '15px' }}>lock</span>
              <span>Operator &amp; Staff Login</span>
            </Link>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className={styles.copyright}>
          <p>© {new Date().getFullYear()} New Pandit Masala &amp; Tel Mill. All Rights Reserved.</p>
          <div className={styles.copyrightLinks}>
            <Link href="/products">Store</Link>
            <span aria-hidden="true">•</span>
            <Link href="/services">Services</Link>
            <span aria-hidden="true">•</span>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
