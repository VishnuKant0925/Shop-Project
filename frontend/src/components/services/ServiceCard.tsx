import Image from 'next/image';
import { Service } from '@/types';
import styles from './ServiceCard.module.css';

interface ServiceCardProps {
  service: Service;
}

const MAX_FEATURES = 3;

/** Compact service row: photo, name, rate, a few key features and a booking action. */
export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.image}>
        <Image src={service.imageUrl} alt={`${service.name} at New Pandit Mill`} fill sizes="(max-width: 640px) 96px, 140px" />
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{service.name}</h3>
        <p className={styles.rate}>
          <strong>₹{service.rate}</strong> {service.rateUnit}
        </p>
        {service.features.length > 0 && (
          <ul className={styles.features}>
            {service.features.slice(0, MAX_FEATURES).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
        <a href="tel:+919934787476" className={styles.book}>
          <span className="material-symbols-outlined" aria-hidden="true">call</span>
          Book
        </a>
      </div>
    </article>
  );
}
