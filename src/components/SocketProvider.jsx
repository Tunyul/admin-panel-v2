import React, { useEffect } from 'react';
import useSocket from '../hooks/useSocket';
import { getNotifications, getUnreadCount } from '../api/notifications';
import useNotificationStore from '../store/notificationStore';

// Simple provider component: connects when token exists; resets unread when route to /payments
export default function SocketProvider({ children, url } = {}) {
  // Prefer explicit URL prop, then VITE_API_BASE_URL, then default to '/'.
  // If the API base includes a path (for example '/api' or '/api/v1'), strip the path
  // so the socket client connects to the server origin. Socket.io expects a host/origin,
  // not an API path.
  // Prefer explicit socket URL via VITE_SOCKET_URL (useful for local/dev testing)
  // Example: VITE_SOCKET_URL=http://192.168.69.104:3000
  const envSocketUrl = typeof import.meta !== 'undefined' ? import.meta.env.VITE_SOCKET_URL : undefined;
  // new: prefer explicit app url env (APP_URL or VITE_APP_URL) as a candidate for backend origin
  const envAppUrl = typeof import.meta !== 'undefined' ? (import.meta.env.APP_URL || import.meta.env.VITE_APP_URL) : undefined;
  const envUrlRaw = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : undefined;
  const normalizeOrigin = (u) => {
    if (!u) return undefined;
    try {
      const parsed = new URL(u);
      // return origin only (scheme + host + port)
      return parsed.origin;
    } catch {
      // if it's a relative path like '/api', try to resolve against current location
      if (u.startsWith('/')) {
        return `${window.location.protocol}//${window.location.host}`;
      }
      return u;
    }
  };
  // Priority: explicit `url` prop -> VITE_SOCKET_URL -> APP_URL/VITE_APP_URL -> normalized VITE_API_BASE_URL -> fallback to http://<host>:3000
  const hostFallback = (typeof window !== 'undefined' && window.location && window.location.hostname) ? `http://${window.location.hostname}:3000` : undefined;
  const socketUrl = url || envSocketUrl || envAppUrl || normalizeOrigin(envUrlRaw) || hostFallback || undefined;
  const { connect, disconnect } = useSocket({ url: socketUrl, sticky: true });
  const setItemsStore = useNotificationStore((s) => s.setItems);
  const setUnread = useNotificationStore((s) => s.setUnread);

  useEffect(() => {
    if (import.meta.env && import.meta.env.DEV) console.debug('[socket] socketUrl resolved to', socketUrl);
    // Read token at effect time so we react to changes even if component wasn't remounted.
    const t = localStorage.getItem('token');
    // helper: parse JWT payload safely (base64url aware)
  const parseJwt = (token) => {
      if (!token) return null;
      try {
        const part = String(token).split('.')[1] || '';
        const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(padded);
        try {
          const uri = decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('');
          return JSON.parse(decodeURIComponent(uri));
        } catch {
          return JSON.parse(decoded);
        }
      } catch { return null; }
    };

    if (t) {
      const payload = parseJwt(t);
      // Only auto-connect when token role is admin — server joins role:admin room automatically
      if (payload && payload.role === 'admin') {
        connect();
      } else {
        // show a dev notification to help debugging if token isn't admin
        try {
          if (import.meta.env && import.meta.env.DEV) {
            useNotificationStore.getState().showNotification('Socket not connected: token role != admin', 'warning');
          }
        } catch {
          // ignore
        }
      }
      // fetch recent notifications and unread count to populate header and center
      (async () => {
        try {
          const res = await getNotifications({ limit: 50 });
          const data = res?.data?.body_parsed ?? res?.data?.data ?? res?.data ?? [];
          setItemsStore(Array.isArray(data) ? data : []);
        } catch {
          // ignore fetch errors
        }
        try {
            const r2 = await getUnreadCount(); 
          const serverUnread = r2?.data?.data?.unread ?? r2?.data?.unread ?? 0;
          setUnread(serverUnread);
        } catch {
            return null; 
        }
      })();
    }

    // Listen for token changes from other tabs/contexts and reconnect/disconnect accordingly.
    const onStorage = (_e) => {
      if (_e.key !== 'token') return;
      if (_e.newValue) {
        connect();
      } else {
        disconnect();
      }
    };

    window.addEventListener('storage', onStorage);

    // allow same-tab reconnect via custom event (useful when token was set in same tab)
    const onReconnect = (ev) => {
      try {
        const suppliedToken = ev?.detail?.token;
        if (suppliedToken) {
          // store supplied token and connect
          try { localStorage.setItem('token', suppliedToken); } catch { /* ignore */ }
          connect();
          // also refresh notifications/unread on explicit reconnect
          (async () => {
            try {
              const res = await getNotifications({ limit: 50 });
              const data = res?.data?.body_parsed ?? res?.data?.data ?? res?.data ?? [];
              setItemsStore(Array.isArray(data) ? data : []);
            } catch { /* ignore */ }
            try {
              const r2 = await getUnreadCount();
              const serverUnread = r2?.data?.data?.unread ?? r2?.data?.unread ?? 0;
              setUnread(serverUnread);
            } catch { /* ignore */ }
          })();
        } else {
          // just attempt to connect (reads token via getToken inside hook)
          connect();
        }
      } catch (err) {
        console.debug('[socket] reconnect handler error', err);
      }
    };
    window.addEventListener('app:socket:reconnect', onReconnect);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('app:socket:reconnect', onReconnect);
      // make sure socket is disconnected when provider unmounts
      disconnect();
    };
  // depend on stable connect/disconnect functions from the hook
  }, [connect, disconnect, setItemsStore, setUnread, socketUrl]);

  // No DOM output, just render children
  return (<>{children}</>);
}
