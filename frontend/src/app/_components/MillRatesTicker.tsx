'use client';

import { useSettings } from '@/context/SettingsContext';
import styles from '../page.module.css';

// Shown until the admin-managed rates load (or if none are configured yet).
const fallbackRates = [
  { label: 'Yellow Mustard Oil', price: '₹172/L' },
  { label: 'Black Mustard Oil', price: '₹158/L' },
  { label: 'Turmeric Grinding', price: '₹18/kg' },
  { label: 'Chilli Grinding', price: '₹22/kg' },
  { label: 'Fresh Chakki Atta', price: '₹6/kg' },
];

export default function MillRatesTicker() {
  const { settings, isLoaded } = useSettings();
  const rates = isLoaded ? settings.millRates : fallbackRates;
  if (rates.length === 0) return null;

  return (
    <section className={styles.ticker} aria-label="Today's mill rates">
      <div className={styles.tickerInner}>
        <div className={styles.tickerItems}>
          <span className={styles.tickerLabel}>
            <span className={styles.tickerDot}></span>
            Today&apos;s Mill Rates:
          </span>
          {rates.map((rate) => (
            <span key={rate.label} className={styles.tickerRate}>
              <strong>{rate.label}:</strong>{' '}
              <span className={styles.tickerPrice}>{rate.price}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
