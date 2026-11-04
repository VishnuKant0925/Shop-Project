'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { isActivePath } from './Navbar';
import styles from './BottomNav.module.css';

// App-style tab bar shown on phones only (see BottomNav.module.css).
export default function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { user } = useAuth();

  const accountHref = user ? '/profile' : '/auth/login';
  const tabs = [
    { href: '/', label: 'Home', icon: 'home' },
    { href: '/products', label: 'Store', icon: 'storefront' },
    { href: '/services', label: 'Services', icon: 'settings' },
    { href: '/cart', label: 'Cart', icon: 'shopping_basket', badge: totalItems },
    { href: accountHref, label: user ? 'Account' : 'Login', icon: 'person', match: ['/profile', '/orders', '/auth'] },
  ];

  return (
    <nav className={styles.bottomNav} aria-label="Primary">
      {tabs.map((tab) => {
        const active = tab.match
          ? tab.match.some((m) => pathname?.startsWith(m))
          : isActivePath(pathname, tab.href);
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className={styles.iconWrap}>
              <span className={`material-symbols-outlined ${active ? 'icon-filled' : ''}`} aria-hidden="true">
                {tab.icon}
              </span>
              {!!tab.badge && <span className={styles.badge}>{tab.badge > 99 ? '99+' : tab.badge}</span>}
            </span>
            <span className={styles.label}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
