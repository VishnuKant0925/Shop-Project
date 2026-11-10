'use client';

import { useState } from 'react';
import styles from './YieldCalculator.module.css';

const weights = [10, 25, 50, 100];

/** Quick estimate of oil and oil-cake yield for a batch of mustard seed. */
export default function YieldCalculator() {
  const [kg, setKg] = useState(50);

  return (
    <div className={styles.card}>
      <div className={styles.pills} role="radiogroup" aria-label="Seed weight">
        {weights.map((w) => (
          <button
            key={w}
            type="button"
            role="radio"
            aria-checked={kg === w}
            className={`${styles.pill} ${kg === w ? styles.pillActive : ''}`}
            onClick={() => setKg(w)}
          >
            {w} kg
          </button>
        ))}
      </div>
      <dl className={styles.results} aria-live="polite">
        <div>
          <dt>Pure oil</dt>
          <dd>{(kg * 0.33).toFixed(1)} L</dd>
        </div>
        <div>
          <dt>Oil cake (खली)</dt>
          <dd>{(kg * 0.66).toFixed(1)} kg</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>~{Math.round(kg * 0.5)} min</dd>
        </div>
      </dl>
    </div>
  );
}
