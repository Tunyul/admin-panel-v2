import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useNotificationStore from '../store/notificationStore';

// Minimal hook that manages a single socket instance and exposes connect/disconnect
export default function useSocket({ url, autoConnect = true } = {}) {
  const socketRef = useRef(null);
  const connectedRef = useRef(false);
  const { showNotification, incrementUnread, prependItem } = useNotificationStore();

  const getToken = useCallback(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current && connectedRef.current) return socketRef.current;
    const token = getToken();
    if (!token) return null;

    const socket = io(url || '/', {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      connectedRef.current = true;
      console.debug('[socket] connected', socket.id);
    });

    socket.on('disconnect', (reason) => {
      connectedRef.current = false;
      console.debug('[socket] disconnected', reason);
    });

    // invoice.notify event
    socket.on('invoice.notify', (payload) => {
      try {
        const title = `Invoice: ${payload.no_transaksi}`;
        const msg = `Status: ${payload.status}`;
        showNotification(`${title} — ${msg}`, 'info');
        // optimistic prepend to FE store so dialog shows immediately
        const item = {
          id: payload.id || `invoice-${payload.no_transaksi}-${Date.now()}`,
          title,
          message: msg,
          no_transaksi: payload.no_transaksi,
          invoice_url: payload.invoice_url,
          status: payload.status,
          timestamp: payload.timestamp || new Date().toISOString(),
          read: false,
        };
        prependItem(item);
        incrementUnread(1);
      } catch (err) {
        console.debug('[socket] invoice.notify handler error', err);
      }
    });

    // proposed payment events
    socket.on('payment.created', (p) => {
      try {
        const title = `Pembayaran: ${p.no_transaksi}`;
        const msg = `Rp${p.nominal} — ${p.status || 'created'}`;
        showNotification(`${title} — ${msg}`, 'success');
        const item = {
          id: p.id_payment || p.id || `payment-${p.no_transaksi}-${Date.now()}`,
          title,
          message: msg,
          no_transaksi: p.no_transaksi,
          nominal: p.nominal,
          status: p.status,
          timestamp: p.timestamp || new Date().toISOString(),
          read: false,
        };
        prependItem(item);
        incrementUnread(1);
      } catch (err) { console.debug('[socket] payment.created handler error', err); }
    });

    socket.on('payment.updated', (p) => {
      try {
        const title = `Update pembayaran: ${p.no_transaksi}`;
        const msg = `${p.status}`;
        showNotification(`${title} — ${msg}`, 'info');
        const item = {
          id: p.id_payment || p.id || `payment-${p.no_transaksi}-${Date.now()}`,
          title,
          message: msg,
          no_transaksi: p.no_transaksi,
          nominal: p.nominal,
          status: p.status,
          timestamp: p.timestamp || new Date().toISOString(),
          read: false,
        };
        prependItem(item);
        incrementUnread(1);
      } catch (err) { console.debug('[socket] payment.updated handler error', err); }
    });

    return socket;
  }, [getToken, url, showNotification, incrementUnread, prependItem]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch (err) { console.debug('[socket] disconnect error', err); }
      socketRef.current = null;
      connectedRef.current = false;
    }
  }, []);

  // helper to refresh token while keeping the socket (recommended flow)
  const setTokenAndReconnect = useCallback((newToken) => {
    if (!socketRef.current) return connect();
    try {
      socketRef.current.auth = { token: newToken };
      socketRef.current.connect();
    } catch (err) {
      // fallback: recreate
      console.debug('[socket] setTokenAndReconnect fallback', err);
      disconnect();
      connect();
    }
  }, [connect, disconnect]);

  useEffect(() => {
    if (autoConnect) connect();
    return () => disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    connect,
    disconnect,
    setTokenAndReconnect,
    socket: socketRef,
    isConnected: connectedRef,
  };
}
