'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { StoreSettings } from '@/types';

// Used until the API answers (and if it is unreachable), so the store always renders.
export const defaultSettings: StoreSettings = {
  storeName: 'New Pandit Masala & Tel Mill',
  phones: ['+919934787476', '+918226889960'],
  whatsapp: '919934787476',
  email: 'asharfipandit844121@gmail.com',
  address: 'Vaishali Bus Stand Road, Lalganj 844121, Vaishali, Bihar',
  hours: 'Mon - Sun: 8:00 AM - 9:00 PM',
  upiId: '6205372825@axl',
  upiName: 'New Pandit Masala Tel Mill',
  taxRate: 5,
  acceptingOrders: true,
  closedMessage: 'Online ordering is paused right now. Please call the mill to order.',
  announcement: '',
  millRates: [],
};

const SettingsContext = createContext<{ settings: StoreSettings; isLoaded: boolean }>({
  settings: defaultSettings,
  isLoaded: false,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () => {
      api.getSettings()
        .then((s) => active && setSettings({ ...defaultSettings, ...s }))
        .catch(() => undefined)
        .finally(() => active && setIsLoaded(true));
    };
    load();

    // Admin edits apply to open storefront tabs immediately.
    const socket = getSocket();
    socket.on('settings:changed', load);
    return () => {
      active = false;
      socket.off('settings:changed', load);
    };
  }, []);

  return <SettingsContext.Provider value={{ settings, isLoaded }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);

/** Format a phone like +919934787476 as +91 99347 87476 for display. */
export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
};

/** tel: link value for a stored phone number. */
export const telHref = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  return `tel:+${digits.length === 10 ? `91${digits}` : digits}`;
};
