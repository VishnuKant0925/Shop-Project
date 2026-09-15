'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

interface OrderNotification {
  orderId: string;
  orderNumber: string;
  status: string;
}

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

export default function OrderNotificationToast() {
  const { user } = useAuth();
  const [notification, setNotification] = useState<OrderNotification | null>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
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
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket: Socket = io(SOCKET_URL, { transports: ['polling', 'websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', user.id);
    });

    socket.on('order:status-changed', (data: OrderNotification) => {
      setNotification(data);
      setVisible(true);
      setExiting(false);

      // Auto-dismiss after 12 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => dismiss(), 12000);
    });

    return () => {
      socket.disconnect();
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
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      maxWidth: '400px',
      width: '100%',
      background: '#ffffff',
      border: '1px solid #e2ded6',
      borderRadius: '16px',
      boxShadow: '0 20px 50px rgba(31,29,26,0.18), 0 8px 16px rgba(31,29,26,0.08)',
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
          fontFamily: "'Work Sans', sans-serif",
          fontWeight: 700,
          fontSize: '15px',
          color: '#1f1d1a',
          marginBottom: '4px',
        }}>
          {msg.title}
        </div>
        <div style={{
          fontSize: '13px',
          color: '#5f5b53',
          lineHeight: 1.5,
        }}>
          {msg.body}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        style={{
          flexShrink: 0,
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          background: 'rgba(31,29,26,0.06)',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#5f5b53',
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
