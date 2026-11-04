'use client';

import { useState } from 'react';
import styles from '../page.module.css';

const calcWeights = [10, 25, 50, 100];

export default function YieldCalculator() {
  const [selectedWeight, setSelectedWeight] = useState(50);
  const oilYield = (selectedWeight * 0.33).toFixed(1);
  const cakeYield = (selectedWeight * 0.66).toFixed(1);

  return (
    <div className={styles.calcCard}>
      <span className={styles.calcLabel} id="calc-weight-label">Select Raw Seed Weight:</span>
      <div className={styles.calcPills} role="radiogroup" aria-labelledby="calc-weight-label">
        {calcWeights.map((w) => (
          <button
            key={w}
            type="button"
            role="radio"
            aria-checked={selectedWeight === w}
            className={`${styles.calcPill} ${selectedWeight === w ? styles.calcPillActive : ''}`}
            onClick={() => setSelectedWeight(w)}
          >
            {w} kg
          </button>
        ))}
      </div>
      <div className={styles.calcResults} aria-live="polite">
        <div className={styles.calcResult}>
          <span className={styles.calcResultLabel}>Estimated Pure Oil</span>
          <span className={styles.calcResultValue}>{oilYield} L</span>
          <span className={styles.calcResultSub}>~33% Extraction</span>
        </div>
        <div className={styles.calcResult}>
          <span className={styles.calcResultLabel}>Fresh Oil Cake (खली)</span>
          <span className={`${styles.calcResultValue} ${styles.calcResultSecondary}`}>{cakeYield} kg</span>
          <span className={styles.calcResultSub}>~66% Cattle Feed</span>
        </div>
      </div>
      <div className={styles.calcFooter}>
        <span className={styles.calcFooterItem}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>schedule</span>
          Processing Time: ~{Math.round(selectedWeight * 0.5)} mins
        </span>
        <a href="tel:+919934787476" className={styles.calcFooterLink}>Book Slot →</a>
      </div>
    </div>
  );
}
