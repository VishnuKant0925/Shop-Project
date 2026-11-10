'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPhone, telHref, useSettings } from '@/context/SettingsContext';
import styles from './Footer.module.css';

const links = [
  { href: '/products', label: 'Store' },
  { href: '/products/mustard-oil', label: 'Mustard Oil' },
  { href: '/products/turmeric-powder', label: 'Turmeric' },
  { href: '/products/red-chili-powder', label: 'Chilli Powder' },
  { href: '/services', label: 'Milling Services' },
  { href: '/contact', label: 'Contact' },
];

/** Compact footer: who we are, three one-tap actions, key links. */
export default function Footer() {
  const { settings } = useSettings();
  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(`${settings.storeName}, ${settings.address}`);
  const primaryPhone = settings.phones[0];

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <span className={styles.logo}>
              <Image src="/images/logo.jpeg" alt="" width={36} height={36} />
            </span>
            <div>
              <strong className={styles.brandName}>New Pandit Masala &amp; Tel Mill</strong>
              <span className={styles.meta}>Since 1984 · FSSAI Lic. 10023948000122</span>
            </div>
          </div>

          <div className={styles.actions}>
            {primaryPhone && (
              <a href={telHref(primaryPhone)} className={styles.action}>
                <span className="material-symbols-outlined" aria-hidden="true">call</span>
                <span className={styles.wideOnly}>{formatPhone(primaryPhone)}</span>
                <span className={styles.narrowOnly}>Call</span>
              </a>
            )}
            <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className={styles.action}>
              <span className="material-symbols-outlined" aria-hidden="true">chat</span>
              <span>WhatsApp</span>
            </a>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.action}>
              <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
              <span>Directions</span>
            </a>
          </div>
        </div>

        <p className={styles.address}>
          {settings.address} · {settings.hours}
        </p>

        <nav aria-label="Footer" className={styles.links}>
          {links.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </nav>

        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} New Pandit Masala &amp; Tel Mill</span>
          <Link href="/auth/login" className={styles.staff}>Staff login</Link>
        </div>
      </div>
    </footer>
  );
}
