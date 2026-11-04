'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import Footer from './Footer';
import AnnouncementBar from './AnnouncementBar';
import OrderNotificationToast from '@/components/notifications/OrderNotification';
import styles from './AppShell.module.css';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  // The admin panel is designed for light mode only; restore the visitor's theme when leaving it.
  useEffect(() => {
    const root = document.documentElement;
    if (isAdmin) {
      root.dataset.theme = 'light';
      return;
    }
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('theme');
    } catch {
      // Storage unavailable; fall back to the system preference.
    }
    root.dataset.theme = saved === 'light' || saved === 'dark'
      ? saved
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [isAdmin]);

  if (isAdmin) {
    return (
      <>
        {children}
        <OrderNotificationToast />
      </>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" className={styles.main}>
        {children}
      </main>
      <Footer />
      <BottomNav />
      <OrderNotificationToast />
    </>
  );
}
