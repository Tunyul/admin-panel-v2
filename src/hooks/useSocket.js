import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useNotificationStore from '../store/notificationStore';

// Minimal hook that manages a single socket instance and exposes connect/disconnect
export default function useSocket({ url, autoConnect = true, sticky = false } = {}) {
  const socketRef = useRef(null);
  const connectedRef = useRef(false);
  const { showNotification, incrementUnread, prependItem, openCenter } = useNotificationStore();

  // Optional global manager to make the socket sticky across mounts
  const getGlobalManager = () => {
    try {
      if (typeof window === 'undefined') return null;
      if (!window.__APP_SOCKET_MANAGER__) window.__APP_SOCKET_MANAGER__ = { socket: null, connected: false };
      return window.__APP_SOCKET_MANAGER__;
    } catch {
      return null;
    }
  };
  const globalManager = sticky ? getGlobalManager() : null;
  if (globalManager && globalManager.socket) {
    socketRef.current = globalManager.socket;
    connectedRef.current = Boolean(globalManager.connected);
  }

  const getToken = useCallback(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  }, []);

  // Robust JWT payload parser that handles base64url encoding and padding.
  const parseJwtPayload = useCallback((t) => {
    if (!t) return null;
    try {
      const part = String(t).split('.')[1] || '';
      // base64url -> base64
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      // add padding
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      // atob may throw for malformed input
      const decoded = atob(padded);
      // handle binary-safe decode to utf-8
      try {
        // decodeURIComponent trick to properly decode utf-8
        const uri = decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('');
        return JSON.parse(decodeURIComponent(uri));
      } catch {
          return JSON.parse(decoded);
      }
    } catch {
      return null;
    }
  }, []);

  // helper: attach event handlers to a socket instance (idempotent)
  const attachHandlers = useCallback((socket) => {
    if (!socket || socket.__handlersAttached) return;

    socket.on('connect', () => {
      connectedRef.current = true;
      if (globalManager) try { globalManager.connected = true; } catch { /* ignore */ }
      console.debug('[socket] connected', socket.id);
      try { window.dispatchEvent(new CustomEvent('app:socket:status', { detail: { connected: true, id: socket.id } })); } catch { /* ignore */ }
    });

    // After connect, attempt to auto-join rooms based on JWT claims.
    socket.on('connect', () => {
      try {
        const t = getToken();
        if (!t) return;
        const payload = parseJwtPayload(t);
        if (!payload) return;
        const rooms = [];
        if (payload?.role) rooms.push(`role:${payload.role}`);
        if (payload?.id_customer) rooms.push(`customer:${payload.id_customer}`);
        if (payload?.id_user) rooms.push(`internal:${payload.id_user}`);
        if (rooms.length > 0) {
          // emit joinRooms event; server may ignore if not supported
          socket.emit('joinRooms', { rooms });
          console.debug('[socket] emitted joinRooms', rooms);
        }
      } catch (err) {
        console.debug('[socket] auto-join error', err);
      }
    });

    socket.on('disconnect', (reason) => {
      connectedRef.current = false;
      if (globalManager) try { globalManager.connected = false; } catch { /* ignore */ }
      console.debug('[socket] disconnected', reason);
      try { window.dispatchEvent(new CustomEvent('app:socket:status', { detail: { connected: false, reason } })); } catch { /* ignore */ }
    });

    // capture connect errors and expose via global manager + window event for UI
    socket.on('connect_error', (err) => {
      try {
        const msg = err && err.message ? err.message : String(err);
        const code = err && err.code ? err.code : undefined;
        const data = err && err.data ? err.data : undefined;
        console.debug('[socket] connect_error', { msg, code, data });
        const m = globalManager;
        if (m) try { m.lastError = msg; m.lastErrorDetailed = { msg, code, data }; } catch { /* ignore */ }
        try {
          window.dispatchEvent(new CustomEvent('app:socket:error', { detail: { error: msg, code, data, raw: String(err) } }));
        } catch { /* ignore */ }
      } catch { /* ignore */ }
    });
    socket.on('reconnect_error', (err) => {
      try {
        const msg = err && err.message ? err.message : String(err);
        const code = err && err.code ? err.code : undefined;
        const data = err && err.data ? err.data : undefined;
        console.debug('[socket] reconnect_error', { msg, code, data });
        const m = globalManager;
        if (m) try { m.lastError = msg; m.lastErrorDetailed = { msg, code, data }; } catch { /* ignore */ }
        try {
          window.dispatchEvent(new CustomEvent('app:socket:error', { detail: { error: msg, code, data, raw: String(err) } }));
        } catch { /* ignore */ }
      } catch { /* ignore */ }
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
        try { openCenter(); } catch { /* ignore */ }
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
        try { openCenter(); } catch { /* ignore */ }
        try { window.dispatchEvent(new CustomEvent('app:socket:event', { detail: { type: 'payment.created', payload: p } })); } catch { /* ignore */ }
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
        try { openCenter(); } catch { /* ignore */ }
        try { window.dispatchEvent(new CustomEvent('app:socket:event', { detail: { type: 'payment.updated', payload: p } })); } catch { /* ignore */ }
      } catch (err) { console.debug('[socket] payment.updated handler error', err); }
    });

    // new customer/order events (common backend event names)
    socket.on('customer.created', (c) => {
      try {
        if (import.meta.env && import.meta.env.DEV) console.debug('[socket] event customer.created', c);
        const name = c?.name || c?.nama || c?.full_name || 'New customer';
        const title = `Customer baru: ${name}`;
        const msg = c?.phone || c?.email || 'Profile created';
        showNotification(`${title} \u2014 ${msg}`, 'success');
        const item = {
          id: c?.id || `customer-${Date.now()}`,
          title,
          message: msg,
          customer: c,
          timestamp: c?.timestamp || new Date().toISOString(),
          read: false,
        };
        prependItem(item);
        incrementUnread(1);
        try { openCenter(); } catch { /* ignore */ }
      } catch (err) { console.debug('[socket] customer.created handler error', err); }
    });

    socket.on('order.created', (o) => {
      try {
        const no = o?.no_transaksi || o?.id || 'New order';
        const title = `Order baru: ${no}`;
        const msg = o?.customer?.name || o?.customer_name || o?.status || 'Order created';
        showNotification(`${title} \u2014 ${msg}`, 'success');
        const item = {
          id: o?.id || `order-${no}-${Date.now()}`,
          title,
          message: msg,
          order: o,
          no_transaksi: o?.no_transaksi,
          timestamp: o?.timestamp || new Date().toISOString(),
          read: false,
        };
        prependItem(item);
        incrementUnread(1);
        try { openCenter(); } catch { /* ignore */ }
        try { window.dispatchEvent(new CustomEvent('app:socket:event', { detail: { type: 'order.created', payload: o } })); } catch { /* ignore */ }
      } catch (err) { console.debug('[socket] order.created handler error', err); }
    });

    // order.updated
    socket.on('order.updated', (o) => {
      try {
        const no = o?.no_transaksi || o?.id || 'Order updated';
        const title = `Order diperbarui: ${no}`;
        const msg = o?.customer?.name || o?.customer_name || o?.status || 'Order updated';
        showNotification(`${title} \u2014 ${msg}`, 'info');
        const item = {
          id: o?.id || `order-${no}-${Date.now()}`,
          title,
          message: msg,
          order: o,
          no_transaksi: o?.no_transaksi,
          timestamp: o?.timestamp || new Date().toISOString(),
          read: false,
        };
        prependItem(item);
        incrementUnread(1);
        try { openCenter(); } catch { /* ignore */ }
        try { window.dispatchEvent(new CustomEvent('app:socket:event', { detail: { type: 'order.updated', payload: o } })); } catch { /* ignore */ }
      } catch (err) { console.debug('[socket] order.updated handler error', err); }
    });

    // order.status_bot.updated
    socket.on('order.status_bot.updated', (o) => {
      try {
        const no = o?.no_transaksi || o?.id || 'Order status updated';
        const title = `Order bot status: ${no}`;
        const msg = o?.status_bot || o?.status || 'Status updated by bot';
        showNotification(`${title} \u2014 ${msg}`, 'info');
        const item = {
          id: o?.id || `order-status-${no}-${Date.now()}`,
          title,
          message: msg,
          order: o,
          no_transaksi: o?.no_transaksi,
          status_bot: o?.status_bot,
          timestamp: o?.timestamp || new Date().toISOString(),
          read: false,
        };
        prependItem(item);
        incrementUnread(1);
        try { openCenter(); } catch { /* ignore */ }
        try { window.dispatchEvent(new CustomEvent('app:socket:event', { detail: { type: 'order.status_bot.updated', payload: o } })); } catch { /* ignore */ }
      } catch (err) { console.debug('[socket] order.status_bot.updated handler error', err); }
    });

    // customer.updated
    socket.on('customer.updated', (c) => {
      try {
        if (import.meta.env && import.meta.env.DEV) console.debug('[socket] event customer.updated', c);
        const name = c?.name || c?.nama || c?.full_name || 'Customer updated';
        const title = `Customer diperbarui: ${name}`;
        const msg = c?.phone || c?.email || 'Profile updated';
        showNotification(`${title} \u2014 ${msg}`, 'info');
        const item = {
          id: c?.id || `customer-${Date.now()}`,
          title,
          message: msg,
          customer: c,
          timestamp: c?.timestamp || new Date().toISOString(),
          read: false,
        };
        prependItem(item);
        incrementUnread(1);
        try { openCenter(); } catch { /* ignore */ }
      } catch (err) { console.debug('[socket] customer.updated handler error', err); }
    });

    // Generic fallback: listen to any event and try to surface as a notification
  socket.onAny((eventName, payload) => {
      if (import.meta.env && import.meta.env.DEV) console.debug('[socket] onAny event', eventName, payload);
      try {
        // ignore internal socket events
        if (['connect', 'disconnect', 'reconnect', 'reconnect_attempt'].includes(eventName)) return;
        // if we already handled certain events above, skip (they will still reach onAny but we don't want duplicates)
        const handled = ['invoice.notify', 'payment.created', 'payment.updated', 'customer.created', 'order.created'];
        if (handled.includes(eventName)) return;

        const ev = String(eventName || 'notification');
        // derive sensible title/message from payload
        const titleParts = [];
        if (payload) {
          if (payload.no_transaksi) titleParts.push(payload.no_transaksi);
          if (payload.name || payload.nama) titleParts.push(payload.name || payload.nama);
        }
        const title = titleParts.length ? `${ev}: ${titleParts.join(' / ')}` : ev;
        let message = '';
        if (payload) {
          if (payload.message) message = payload.message;
          else if (payload.status) message = String(payload.status);
          else if (payload.nominal) message = `Rp${payload.nominal}`;
          else message = typeof payload === 'string' ? payload : JSON.stringify(payload).slice(0, 200);
        } else {
          message = 'New event from server';
        }

        // determine severity heuristically
        const severity = /created|new|uploaded|success|approved|verified/i.test(ev) ? 'success' : (/error|failed|fail/i.test(ev) ? 'error' : 'info');
        showNotification(`${title} \u2014 ${message}`, severity);
        const item = {
          id: payload?.id || `evt-${ev}-${Date.now()}`,
          title,
          message,
          event: ev,
          payload,
          timestamp: (payload && (payload.timestamp || payload.created_at)) || new Date().toISOString(),
          read: false,
        };
        prependItem(item);
        incrementUnread(1);
        try { window.dispatchEvent(new CustomEvent('app:socket:event', { detail: { type: eventName, payload } })); } catch { /* ignore */ }
      } catch (err) {
        console.debug('[socket] onAny handler error', err);
      }
    });

    socket.__handlersAttached = true;
  }, [getToken, globalManager, parseJwtPayload, showNotification, incrementUnread, prependItem, openCenter]);

  const connect = useCallback(() => {
    // if we already have a connected socket, return it
    if (socketRef.current && connectedRef.current) return socketRef.current;

    const token = getToken();
    if (!token) return null;

    // debug: show the resolved URL and token (dev only)
    if (import.meta.env && import.meta.env.DEV) console.debug('[socket] connecting to', url || '/', 'with token present?', Boolean(token));

    // if a socket object exists (from global sticky state) reuse it and just update auth + attach handlers
    if (socketRef.current) {
      try {
        // ensure auth token is up-to-date
        socketRef.current.auth = { token };
        attachHandlers(socketRef.current);
        // if not connected, call connect()
        try { socketRef.current.connect(); } catch { /* ignore */ }
        return socketRef.current;
      } catch {
        // fallback to recreate
        try { socketRef.current.disconnect && socketRef.current.disconnect(); } catch { /* ignore */ }
        socketRef.current = null;
      }
    }

    // create a new socket instance
    const socket = io(url || '/', {
      // allow polling fallback so environments that block websocket upgrades still work
      // do not force 'websocket' transport here
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

  socketRef.current = socket;
    if (globalManager) {
      try { globalManager.socket = socket; globalManager.connected = false; } catch { /* ignore */ }
    }

    // attach handlers (idempotent)
    attachHandlers(socket);

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
  try { openCenter(); } catch { /* ignore */ }
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
  try { openCenter(); } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent('app:socket:event', { detail: { type: 'payment.created', payload: p } })); } catch { /* ignore */ }
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
  try { openCenter(); } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent('app:socket:event', { detail: { type: 'payment.updated', payload: p } })); } catch { /* ignore */ }
      } catch (err) { console.debug('[socket] payment.updated handler error', err); }
    });

    // new customer/order events (common backend event names)
  socket.on('customer.created', (c) => {
      try {
        if (import.meta.env && import.meta.env.DEV) console.debug('[socket] event customer.created', c);
        const name = c?.name || c?.nama || c?.full_name || 'New customer';
        const title = `Customer baru: ${name}`;
        const msg = c?.phone || c?.email || 'Profile created';
        showNotification(`${title} \u2014 ${msg}`, 'success');
        const item = {
          id: c?.id || `customer-${Date.now()}`,
          title,
          message: msg,
          customer: c,
          timestamp: c?.timestamp || new Date().toISOString(),
          read: false,
        };
  prependItem(item);
  incrementUnread(1);
  try { openCenter(); } catch { /* ignore */ }
      } catch (err) { console.debug('[socket] customer.created handler error', err); }
    });

  socket.on('order.created', (o) => {
      try {
        const no = o?.no_transaksi || o?.id || 'New order';
        const title = `Order baru: ${no}`;
        const msg = o?.customer?.name || o?.customer_name || o?.status || 'Order created';
        showNotification(`${title} \u2014 ${msg}`, 'success');
        const item = {
          id: o?.id || `order-${no}-${Date.now()}`,
          title,
          message: msg,
          order: o,
          no_transaksi: o?.no_transaksi,
          timestamp: o?.timestamp || new Date().toISOString(),
          read: false,
        };
  prependItem(item);
  incrementUnread(1);
  try { openCenter(); } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent('app:socket:event', { detail: { type: 'order.created', payload: o } })); } catch { /* ignore */ }
      } catch (err) { console.debug('[socket] order.created handler error', err); }
    });

    // order.updated
  socket.on('order.updated', (o) => {
      try {
        const no = o?.no_transaksi || o?.id || 'Order updated';
        const title = `Order diperbarui: ${no}`;
        const msg = o?.customer?.name || o?.customer_name || o?.status || 'Order updated';
        showNotification(`${title} \u2014 ${msg}`, 'info');
        const item = {
          id: o?.id || `order-${no}-${Date.now()}`,
          title,
          message: msg,
          order: o,
          no_transaksi: o?.no_transaksi,
          timestamp: o?.timestamp || new Date().toISOString(),
          read: false,
        };
  prependItem(item);
  incrementUnread(1);
  try { openCenter(); } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent('app:socket:event', { detail: { type: 'order.updated', payload: o } })); } catch { /* ignore */ }
      } catch (err) { console.debug('[socket] order.updated handler error', err); }
    });

    // order.status_bot.updated
  socket.on('order.status_bot.updated', (o) => {
      try {
        const no = o?.no_transaksi || o?.id || 'Order status updated';
        const title = `Order bot status: ${no}`;
        const msg = o?.status_bot || o?.status || 'Status updated by bot';
        showNotification(`${title} \u2014 ${msg}`, 'info');
        const item = {
          id: o?.id || `order-status-${no}-${Date.now()}`,
          title,
          message: msg,
          order: o,
          no_transaksi: o?.no_transaksi,
          status_bot: o?.status_bot,
          timestamp: o?.timestamp || new Date().toISOString(),
          read: false,
        };
  prependItem(item);
  incrementUnread(1);
  try { openCenter(); } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent('app:socket:event', { detail: { type: 'order.status_bot.updated', payload: o } })); } catch { /* ignore */ }
      } catch (err) { console.debug('[socket] order.status_bot.updated handler error', err); }
    });

    // customer.updated
  socket.on('customer.updated', (c) => {
      try {
        if (import.meta.env && import.meta.env.DEV) console.debug('[socket] event customer.updated', c);
        const name = c?.name || c?.nama || c?.full_name || 'Customer updated';
        const title = `Customer diperbarui: ${name}`;
        const msg = c?.phone || c?.email || 'Profile updated';
        showNotification(`${title} \u2014 ${msg}`, 'info');
        const item = {
          id: c?.id || `customer-${Date.now()}`,
          title,
          message: msg,
          customer: c,
          timestamp: c?.timestamp || new Date().toISOString(),
          read: false,
        };
  prependItem(item);
  incrementUnread(1);
  try { openCenter(); } catch { /* ignore */ }
      } catch (err) { console.debug('[socket] customer.updated handler error', err); }
    });

    // Generic fallback: listen to any event and try to surface as a notification
    // This helps when backend uses different event names (e.g. payment.proof, payment.uploaded, customer.new)
  socket.onAny((eventName, payload) => {
      if (import.meta.env && import.meta.env.DEV) console.debug('[socket] onAny event', eventName, payload);
      try {
        // ignore internal socket events
        if (['connect', 'disconnect', 'reconnect', 'reconnect_attempt'].includes(eventName)) return;
        // if we already handled certain events above, skip (they will still reach onAny but we don't want duplicates)
        const handled = ['invoice.notify', 'payment.created', 'payment.updated', 'customer.created', 'order.created'];
        if (handled.includes(eventName)) return;

        const ev = String(eventName || 'notification');
        // derive sensible title/message from payload
        const titleParts = [];
        if (payload) {
          if (payload.no_transaksi) titleParts.push(payload.no_transaksi);
          if (payload.name || payload.nama) titleParts.push(payload.name || payload.nama);
        }
        const title = titleParts.length ? `${ev}: ${titleParts.join(' / ')}` : ev;
        let message = '';
        if (payload) {
          if (payload.message) message = payload.message;
          else if (payload.status) message = String(payload.status);
          else if (payload.nominal) message = `Rp${payload.nominal}`;
          else message = typeof payload === 'string' ? payload : JSON.stringify(payload).slice(0, 200);
        } else {
          message = 'New event from server';
        }

        // determine severity heuristically
        const severity = /created|new|uploaded|success|approved|verified/i.test(ev) ? 'success' : (/error|failed|fail/i.test(ev) ? 'error' : 'info');
        showNotification(`${title} \u2014 ${message}`, severity);
        const item = {
          id: payload?.id || `evt-${ev}-${Date.now()}`,
          title,
          message,
          event: ev,
          payload,
          timestamp: (payload && (payload.timestamp || payload.created_at)) || new Date().toISOString(),
          read: false,
        };
        prependItem(item);
        incrementUnread(1);
  try { window.dispatchEvent(new CustomEvent('app:socket:event', { detail: { type: eventName, payload } })); } catch { /* ignore */ }
      } catch (err) {
        console.debug('[socket] onAny handler error', err);
      }
    });

    return socket;
  }, [getToken, url, showNotification, incrementUnread, prependItem, attachHandlers, globalManager, openCenter]);

  const disconnect = useCallback((force = false) => {
    // If sticky, ignore normal disconnect unless force=true
    if (sticky && !force) return;
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch (err) { console.debug('[socket] disconnect error', err); }
      if (globalManager) {
        try { globalManager.socket = null; globalManager.connected = false; } catch { /* ignore */ }
      }
      socketRef.current = null;
      connectedRef.current = false;
    }
  }, [sticky, globalManager]);

  // helper to refresh token while keeping the socket (recommended flow)
  const setTokenAndReconnect = useCallback((newToken) => {
    if (!socketRef.current) return connect();
    try {
      socketRef.current.auth = { token: newToken };
      socketRef.current.connect();
    } catch (err) {
      // fallback: recreate
      console.debug('[socket] setTokenAndReconnect fallback', err);
      // if sticky we force recreation
      disconnect(true);
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
