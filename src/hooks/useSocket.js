import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useNotificationStore from '../store/notificationStore';

// Minimal hook that manages a single socket instance and exposes connect/disconnect
export default function useSocket({ url, autoConnect = true } = {}) {
  const socketRef = useRef(null);
  const connectedRef = useRef(false);
  const { showNotification, incrementUnread } = useNotificationStore();

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
        incrementUnread(1);
      } catch (err) {
        console.debug('[socket] invoice.notify handler error', err);
      }
    });

    // proposed payment events
    socket.on('payment.created', (p) => {
      try {
        showNotification(`Pembayaran diterima ${p.no_transaksi} — Rp${p.nominal}`, 'success');
        incrementUnread(1);
      } catch (err) { console.debug('[socket] payment.created handler error', err); }
    });

    socket.on('payment.updated', (p) => {
      try {
        showNotification(`Update pembayaran ${p.no_transaksi} — ${p.status}`, 'info');
        incrementUnread(1);
      } catch (err) { console.debug('[socket] payment.updated handler error', err); }
    });

    return socket;
  }, [getToken, url, showNotification, incrementUnread]);

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
