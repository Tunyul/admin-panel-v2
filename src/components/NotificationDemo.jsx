import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useNotificationStore from '../store/notificationStore';

function useNotifications(token, url = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000')) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(url, { auth: { token }, transports: ['websocket'] });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
  socket.on('connect_error', () => console.error('socket connect_error'));

    // register general handlers
    const { prependItem, incrementUnread, showNotification } = useNotificationStore.getState();
    const handler = (eventName) => (payload) => {
      try {
        // build a simple notification item to surface in main UI
        const title = (eventName === 'invoice.notify') ? `Invoice: ${payload.no_transaksi || ''}` : (payload?.no_transaksi || payload?.nama || eventName);
        const message = payload?.status || payload?.no_transaksi || payload?.nama || JSON.stringify(payload).slice(0, 120);
        showNotification(`${title} — ${message}`, 'info');
        const item = {
          id: payload?.id_notification || payload?.id || `${eventName}-${Date.now()}`,
          title,
          message,
          event: eventName,
          payload,
          timestamp: payload?.timestamp || new Date().toISOString(),
          read: false,
        };
        prependItem(item);
        incrementUnread(1);
      } catch {
        // ignore store errors in demo
      }
    };

  const eventsToListen = ['customer.created', 'customer.updated', 'order.created', 'order.updated', 'order.status_bot.updated', 'invoice.notify', 'payment.created', 'payment.updated'];
  eventsToListen.forEach(e => socket.on(e, handler(e)));

    return () => {
      eventsToListen.forEach(e => socket.off(e));
      try { socket.disconnect(); } catch { /* ignore */ }
    };
  }, [token, url]);

  return { connected };
}

function NotificationDemo({ token }) {
  const { connected } = useNotifications(token);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 8, position: 'fixed', left: 12, bottom: 12, zIndex: 9999, width: 260, background: 'white', border: '1px solid #eee', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: connected ? '#2e7d32' : '#bdbdbd' }} />
        <div style={{ fontSize: 13 }}><strong>Socket:</strong> {connected ? 'Terhubung' : 'Terputus'}</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#444' }}>Masukkan token JWT ke prop `token` ketika merender komponen ini.</div>
    </div>
  );
}

export default NotificationDemo;
