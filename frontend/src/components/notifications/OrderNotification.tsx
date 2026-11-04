'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';

interface OrderNotification {
  orderId: string;
  orderNumber: string;
  status: string;
}

export default function OrderNotificationToast() {
  const { user } = useAuth();
  const [notification, setNotification] = useState<OrderNotification | null>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      setNotification(null);
    }, 300);
  }, []);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    const handleStatusChange = (data: OrderNotification) => {
      setNotification(data);
      setVisible(true);
      setExiting(false);

      // Auto-dismiss after 12 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => dismiss(), 12000);
    };
    socket.on('order:status-changed', handleStatusChange);

    return () => {
      socket.off('order:status-changed', handleStatusChange);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, dismiss]);

  if (!visible || !notification) return null;

  const statusMessages: Record<string, { emoji: string; title: string; body: string }> = {
    preparing: {
      emoji: '👨‍🍳',
      title: 'Order Being Prepared',
      body: `Your order #${notification.orderNumber} is now being prepared!`,
    },
    ready: {
      emoji: '🎉',
      title: 'Order Ready for Pickup!',
      body: `Your order #${notification.orderNumber} is ready! Visit the shop to collect it.`,
    },
    completed: {
      emoji: '✅',
      title: 'Order Completed',
      body: `Your order #${notification.orderNumber} has been marked as completed. Thank you!`,
    },
    cancelled: {
      emoji: '❌',
      title: 'Order Cancelled',
      body: `Your order #${notification.orderNumber} has been cancelled.`,
    },
  };

  const msg = statusMessages[notification.status] || {
    emoji: '📦',
    title: 'Order Update',
    body: `Your order #${notification.orderNumber} status changed to ${notification.status}.`,
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(16px + var(--bottom-nav-height) + var(--safe-bottom))',
      right: '16px',
      zIndex: 9999,
      maxWidth: '400px',
      width: 'calc(100% - 32px)',
      background: 'var(--color-surface-container-lowest)',
      border: '1px solid var(--color-outline)',
      borderRadius: '16px',
      boxShadow: 'var(--shadow-xl)',
      padding: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
      animation: exiting ? 'slideOutRight 0.3s ease-in forwards' : 'slideInRight 0.4s ease-out forwards',
      cursor: 'pointer',
    }} onClick={dismiss}>
      <span style={{ fontSize: '2rem', flexShrink: 0 }}>{msg.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '15px',
          color: 'var(--color-on-surface)',
          marginBottom: '4px',
        }}>
          {msg.title}
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--color-on-surface-variant)',
          lineHeight: 1.5,
        }}>
          {msg.body}
        </div>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        style={{
          flexShrink: 0,
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          background: 'var(--color-surface-container)',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '14px',
          color: 'var(--color-on-surface-variant)',
        }}
      >
        ✕
      </button>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100px); }
        }
      `}</style>
    </div>
  );
}
