import React, { useEffect, useState } from 'react';
import { Button, Box, Typography, Paper, IconButton, List, ListItem, ListItemText, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import useSocket from '../hooks/useSocket';
import useNotificationStore from '../store/notificationStore';

// Dev-only sticky panel: shows socket info and a recent notification list
export default function DevSocketTester() {
  // request a sticky socket to reflect actual app behavior
  const { socket, connect, disconnect, setTokenAndReconnect } = useSocket({ sticky: true });
  const [open, setOpen] = useState(true);
  const [connected, setConnected] = useState(false);
  const [sid, setSid] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [token, setToken] = useState(null);
  const [tokenPayload, setTokenPayload] = useState(null);
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [resolvedApi, setResolvedApi] = useState(null);
  const [localServer, setLocalServer] = useState('http://localhost:3000');
  const [appUrl, setAppUrl] = useState(null);
  const [lastAttemptAt, setLastAttemptAt] = useState(null);
  const [lastConnectedAt, setLastConnectedAt] = useState(null);
  const [lastErrorDetailed, setLastErrorDetailed] = useState(null);
  const items = useNotificationStore((s) => s.items || []);
  const unread = useNotificationStore((s) => s.unreadCount || 0);

  useEffect(() => {
    const statusHandler = (e) => {
      const d = e?.detail || {};
      setConnected(Boolean(d.connected));
      if (d.id) setSid(d.id);
      if (d.connected) setLastConnectedAt(new Date().toISOString());
    };
    const errHandler = (e) => {
      const err = e?.detail?.error || null;
      setLastError(err);
      try { setLastErrorDetailed(e?.detail || null); } catch { /* ignore */ }
    };
    window.addEventListener('app:socket:status', statusHandler);
    window.addEventListener('app:socket:error', errHandler);
    // hydrate from global manager if present
    try {
      const m = (typeof window !== 'undefined' && window.__APP_SOCKET_MANAGER__) ? window.__APP_SOCKET_MANAGER__ : null;
      if (m) {
        setSid(m.socket && m.socket.id ? m.socket.id : null);
        setLastError(m.lastError || null);
        setConnected(Boolean(m.connected));
        setLastErrorDetailed(m.lastErrorDetailed || null);
      }
    } catch { /* ignore */ }
    // read token for dev display and react to future changes
    const parseAndSet = (t) => {
      setToken(t);
      if (!t) {
        setTokenPayload(null);
        return;
      }
      try {
        const part = String(t).split('.')[1] || '';
        const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(padded);
        try {
          const uri = decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('');
          setTokenPayload(JSON.parse(decodeURIComponent(uri)));
        } catch (e) {
          setTokenPayload(JSON.parse(decoded));
        }
      } catch (e) {
        setTokenPayload(null);
      }
    };
    try { parseAndSet((typeof window !== 'undefined') ? localStorage.getItem('token') : null); } catch (e) { /* ignore */ }

    const onStorage = (e) => {
      if (e.key !== 'token') return;
      try { parseAndSet(e.newValue); } catch (err) { /* ignore */ }
    };
    const onReconnectEvent = (ev) => {
      try {
        const suppliedToken = ev?.detail?.token;
        if (suppliedToken) {
          try { localStorage.setItem('token', suppliedToken); } catch {}
          parseAndSet(suppliedToken);
        } else {
          parseAndSet(localStorage.getItem('token'));
        }
        setLastAttemptAt(new Date().toISOString());
      } catch (err) { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('app:socket:reconnect', onReconnectEvent);
    // resolve possible socket url candidates (env fallback)
    try {
      const envSocketUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SOCKET_URL : undefined;
      const envApi = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_API_BASE_URL : undefined;
      const runtimeOrigin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'unknown-origin';
      const candidate = envSocketUrl || (envApi ? (() => {
        try { const u = new URL(envApi); return u.origin; } catch { return undefined; }
      })() : undefined) || undefined;
      setResolvedUrl(candidate || runtimeOrigin);
      setResolvedApi(envApi || `not-set (runtime: ${runtimeOrigin})`);
      // additional helpful URLs for dev testing
      setLocalServer('http://localhost:3000');
      const envAppUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? (import.meta.env.APP_URL || import.meta.env.VITE_APP_URL) : undefined;
      setAppUrl(envAppUrl || `http://${window.location.hostname}:3000`);
    } catch (e) { /* ignore */ }
    return () => {
      window.removeEventListener('app:socket:status', statusHandler);
      window.removeEventListener('app:socket:error', errHandler);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('app:socket:reconnect', onReconnectEvent);
    };
  }, []);

  const emitPrompt = () => {
    try {
      const evt = window.prompt('Event name (e.g. order.created)', 'order.created');
      if (!evt) return;
      const payloadRaw = window.prompt('Payload JSON', '{"no_transaksi":"TRX-DEV-1","id_customer":5,"total_bayar":10000}');
      if (!payloadRaw) return;
      const p = JSON.parse(payloadRaw);
      const s = socket?.current;
      if (s && s.connected) {
        s.emit(evt, p);
        console.debug('[dev] emitted', evt, p);
      } else {
        window.dispatchEvent(new CustomEvent('app:dev:socket', { detail: { type: evt, payload: p } }));
        console.debug('[dev] dispatched app:dev:socket', evt, p);
      }
    } catch (err) {
      console.debug('[dev] emit error', err);
      window.alert('Emit failed: ' + (err && err.message ? err.message : String(err)));
    }
  };

  const doForceConnect = () => {
    try {
      let t = token;
      if (!t) {
        t = window.prompt('Supply a token (JWT) to use for socket connect');
        if (!t) return;
        try { localStorage.setItem('token', t); } catch {}
        setToken(t);
        // try parse payload quickly
        try {
          const part = String(t).split('.')[1] || '';
          const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
          const decoded = atob(padded);
          try { setTokenPayload(JSON.parse(decodeURIComponent(decoded.split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')))); } catch(e) { setTokenPayload(JSON.parse(decoded)); }
        } catch (e) { setTokenPayload(null); }
      }
      // try to reuse existing socket if present, else connect
      setLastAttemptAt(new Date().toISOString());
      try {
        // if a socket exists we can set auth and reconnect, else call connect
        if (socket && socket.current) {
          try {
            // prefer setTokenAndReconnect helper when available
            if (setTokenAndReconnect) {
              setTokenAndReconnect(t);
            } else {
              socket.current.auth = { token: t };
              socket.current.connect();
            }
          } catch (e) { connect(); }
        } else {
          connect();
        }
      } catch (e) {
        console.debug('[dev] force connect error', e);
      }
    } catch (e) { /* ignore */ }
  };

  if (!import.meta.env || !import.meta.env.DEV) return null;

  return (
  <Paper elevation={6} sx={{ position: 'fixed', left: 24, bottom: 12, width: 640, maxHeight: '85vh', zIndex: 1400, p: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2">DEV Socket — {connected ? 'Connected' : 'Disconnected'}</Typography>
        <Box>
          <IconButton size="small" onClick={() => setOpen(!open)}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </Box>
      {open && (
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box sx={{ fontSize: 12, color: '#444' }}><strong>Socket id:</strong> <span style={{ wordBreak: 'break-all' }}>{sid || '-'}</span></Box>
          <Box sx={{ fontSize: 12, color: '#444', mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <strong>Token:</strong>
              <div style={{ wordBreak: 'break-all', fontSize: 11, color: '#333' }}>{token || '-'}</div>
            </Box>
            <Tooltip title="Copy token">
              <IconButton size="small" onClick={() => { try { navigator.clipboard.writeText(token || ''); } catch {} }}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ fontSize: 11, color: '#666', mt: 0.5 }}>
            <strong>Payload:</strong> <span style={{ wordBreak: 'break-all' }}>{tokenPayload ? JSON.stringify(tokenPayload) : '-'}</span>
          </Box>
          <Box sx={{ fontSize: 11, color: '#444', mt: 0.5 }}>
            <strong>Socket URL:</strong> <span style={{ wordBreak: 'break-all' }}>{resolvedUrl || '-'}</span>
          </Box>
            <Box sx={{ mt: 0.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ color: 'var(--muted)', fontSize: 12, minWidth: 160 }}>Resolved API Base:</Box>
                  <code style={{ fontSize: 12 }}>{resolvedApi}</code>
                  <IconButton size="small" onClick={() => { try { navigator.clipboard.writeText(resolvedApi || ''); } catch {} }} aria-label="copy-resolved-api">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ color: 'var(--muted)', fontSize: 12, minWidth: 160 }}>Resolved Socket URL:</Box>
                  <code style={{ fontSize: 12 }}>{resolvedUrl}</code>
                  <IconButton size="small" onClick={() => { try { navigator.clipboard.writeText(resolvedUrl || ''); } catch {} }} aria-label="copy-resolved-socket">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ color: 'var(--muted)', fontSize: 12, minWidth: 160 }}>Local server:</Box>
                  <code style={{ fontSize: 12 }}>{localServer}</code>
                  <IconButton size="small" onClick={() => { try { navigator.clipboard.writeText(localServer); } catch {} }} aria-label="copy-local-server">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ color: 'var(--muted)', fontSize: 12, minWidth: 160 }}>Health:</Box>
                  <code style={{ fontSize: 12 }}>{`${localServer}/health`}</code>
                  <IconButton size="small" onClick={() => { try { navigator.clipboard.writeText(`${localServer}/health`); } catch {} }} aria-label="copy-health">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ color: 'var(--muted)', fontSize: 12, minWidth: 160 }}>Swagger UI:</Box>
                  <code style={{ fontSize: 12 }}>{`${localServer}/api-docs`}</code>
                  <IconButton size="small" onClick={() => { try { navigator.clipboard.writeText(`${localServer}/api-docs`); } catch {} }} aria-label="copy-swagger">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ color: 'var(--muted)', fontSize: 12, minWidth: 160 }}>Socket handshake path:</Box>
                  <code style={{ fontSize: 12 }}>{`${localServer}/socket.io/`}</code>
                  <IconButton size="small" onClick={() => { try { navigator.clipboard.writeText(`${localServer}/socket.io/`); } catch {} }} aria-label="copy-socket-path">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ color: 'var(--muted)', fontSize: 12, minWidth: 160 }}>APP_URL (LAN):</Box>
                  <code style={{ fontSize: 12 }}>{appUrl}</code>
                  <IconButton size="small" onClick={() => { try { navigator.clipboard.writeText(appUrl || ''); } catch {} }} aria-label="copy-app-url">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          <Box sx={{ fontSize: 11, color: '#444', mt: 0.5 }}>
            <strong>Last attempt:</strong> <span style={{ wordBreak: 'break-all' }}>{lastAttemptAt || '-'}</span>
            {' '}
            <strong style={{ marginLeft: 8 }}>Last connected:</strong> <span style={{ wordBreak: 'break-all' }}>{lastConnectedAt || '-'}</span>
          </Box>
          <Box sx={{ fontSize: 11, color: '#b00020', mt: 0.5 }}>
            <strong>Last error detailed:</strong> <div style={{ wordBreak: 'break-all', fontSize: 11 }}>{lastErrorDetailed ? JSON.stringify(lastErrorDetailed) : '-'}</div>
          </Box>
          <Box sx={{ fontSize: 12, color: '#b00020', mt: 0.5 }}><strong>Last error:</strong> <span style={{ wordBreak: 'break-all' }}>{lastError || '-'}</span></Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" onClick={() => { try { connect(); } catch { } }}>Reconnect</Button>
            <Button size="small" color="error" variant="outlined" onClick={() => { try { disconnect(true); window.__APP_SOCKET_MANAGER__ = { socket: null, connected: false, lastError: null, lastErrorDetailed: null }; } catch { } }}>Force disconnect</Button>
            <Button size="small" onClick={emitPrompt} variant="contained">Emit</Button>
            <Button size="small" color="primary" variant="contained" onClick={doForceConnect}>Force connect (ignore role)</Button>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption">Recent notifications ({unread} unread)</Typography>
              <Button size="small" onClick={() => { try { useNotificationStore.getState().clearItems && useNotificationStore.getState().clearItems(); } catch {} }}>Clear</Button>
            </Box>
            <List dense sx={{ overflowY: 'auto', flex: '1 1 auto' }}>
              {items && items.length ? items.slice(0, 30).map((it) => (
                <ListItem key={it.id || Math.random()} sx={{ bgcolor: it.read ? 'transparent' : 'rgba(255,209,102,0.08)' }}>
                  <ListItemText primary={it.title || it.event || 'Notification'} secondary={it.message || ''} />
                </ListItem>
              )) : (
                <ListItem><ListItemText primary="No notifications" /></ListItem>
              )}
            </List>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
