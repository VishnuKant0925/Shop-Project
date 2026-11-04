'use client';

import { useSettings } from '@/context/SettingsContext';
import styles from './AnnouncementBar.module.css';

/** Site-wide banner managed from Admin → Store Settings. Also warns when ordering is paused. */
export default function AnnouncementBar() {
  const { settings, isLoaded } = useSettings();
  if (!isLoaded) return null;

  const message = !settings.acceptingOrders ? settings.closedMessage : settings.announcement;
  if (!message) return null;

  return (
    <div className={`${styles.bar} ${!settings.acceptingOrders ? styles.closed : ''}`} role="status">
      {message}
    </div>
  );
}
