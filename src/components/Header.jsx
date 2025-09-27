import React, { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment, IconButton, Box, Paper, Badge, Popover, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useLocation } from 'react-router-dom';

import ThemeSwitcher from './ThemeSwitcher';
import LogoutButton from './LogoutButton';
import { getApiHealth, getDbHealth } from '../api/health';
import NotificationsCenter from './NotificationsCenter';
import useNotificationStore from '../store/notificationStore';
import { markAllAsRead, getNotifications, getUnreadCount } from '../api/notifications';

export default function Header() {
  const [search, setSearch] = useState('');
  const [apiStatus, setApiStatus] = useState({ ok: null });
  const [dbStatus, setDbStatus] = useState({ ok: null });
  const [announce, setAnnounce] = useState('');
  const prevApiRef = useRef(null);
  const prevDbRef = useRef(null);

  // const navigate = useNavigate();
  const location = useLocation();

  // const [notifOpen, setNotifOpen] = useState(false);
  const [apiFlash, setApiFlash] = useState(false);
  const [dbFlash, setDbFlash] = useState(false);
  const [socketStatus, setSocketStatus] = useState({ connected: null });
  const [_socketAnchor, setSocketAnchor] = useState(null);
  const [socketFlash, setSocketFlash] = useState(false);
  const [_lastSocketError, setLastSocketError] = useState(null);
  const [_socketId, setSocketId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchPending = async () => {
      try {
        const mod = await import('../api/payments');
        // pass silent:true so client interceptor doesn't log 500s for this background check
        const res = await mod.getPayments({ silent: true });
        const items = res?.data?.data || res?.data || [];
    const arr = Array.isArray(items) ? items : [];
    // determine pending payments if needed; not used for badge
    const _pending = arr.filter((p) => !p.verified && !(p.status && p.status === 'approved'));
    if (!mounted) return;
    // intentionally not storing pendingCount anymore (badge shows only unread notifications)
      } catch {
        // ignore
      }
    };
    fetchPending();
    const id = setInterval(fetchPending, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // listen for socket status events emitted from useSocket
  useEffect(() => {
    const h = (e) => {
      try {
        const d = e?.detail || {};
        setSocketStatus({ connected: Boolean(d.connected) });
        if (d.id) setSocketId(d.id);
        // flash animation on status change
        setSocketFlash(true);
        setTimeout(() => setSocketFlash(false), 1000);
      } catch {
        setSocketStatus({ connected: null });
      }
    };
    window.addEventListener('app:socket:status', h);
    const eh = (ev) => {
      try {
        const err = ev?.detail?.error || null;
        setLastSocketError(err);
      } catch { /* ignore */ }
    };
    window.addEventListener('app:socket:error', eh);
    // hydrate from global manager if present
    try {
      const m = (typeof window !== 'undefined' && window.__APP_SOCKET_MANAGER__) ? window.__APP_SOCKET_MANAGER__ : null;
      if (m) {
        setSocketId(m.socket && m.socket.id ? m.socket.id : null);
        setLastSocketError(m.lastError || null);
      }
    } catch { /* ignore */ }
    return () => window.removeEventListener('app:socket:status', h);
  }, []);

  // notification store hooks must be declared before effects that use them
  const unreadCount = useNotificationStore((s) => s.unreadCount || 0);
  // local anchor for popover anchored to bell
  const notifOpen = useNotificationStore((s) => s.centerOpen);
  const openCenter = useNotificationStore((s) => s.openCenter);
  const closeCenter = useNotificationStore((s) => s.closeCenter);
  const [anchorEl, setAnchorEl] = React.useState(null);

  // when a socket event arrives, open the notifications center and anchor to the bell
  useEffect(() => {
    const onSocketEvent = () => {
      try {
        // find the notifications button and use it as anchor
        const btn = document.querySelector('button[aria-label="Notifications"]');
        if (btn) setAnchorEl(btn);
        // open the center (store) — it will render anchored to anchorEl
        openCenter();
      } catch {
        // ignore
      }
    };
    window.addEventListener('app:socket:event', onSocketEvent);
    return () => window.removeEventListener('app:socket:event', onSocketEvent);
  }, [openCenter]);


  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!mounted) return;
      
      // Check API health
      try {
        const a = await getApiHealth();
        if (mounted) {
          setApiStatus({ 
            ok: Boolean(a && a.status >= 200 && a.status < 300),
            lastCheck: new Date().toISOString()
          });
        }
      } catch (err) {
        if (mounted) {
          setApiStatus({ 
            ok: false, 
            lastCheck: new Date().toISOString(),
            error: err.message || 'Connection failed'
          });
        }
      }
      
      // Check DB health
      try {
        const d = await getDbHealth();
        if (mounted) {
          setDbStatus({ 
            ok: Boolean(d && d.status >= 200 && d.status < 300),
            lastCheck: new Date().toISOString()
          });
        }
      } catch (err) {
        if (mounted) {
          setDbStatus({ 
            ok: false, 
            lastCheck: new Date().toISOString(),
            error: err.message || 'Connection failed'
          });
        }
      }
    };

    // Initial check
    check();
    
    // Realtime check every 5 seconds (reduced from 10s)
    const t = setInterval(check, 5000);
    
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (prevApiRef.current != null && prevApiRef.current !== apiStatus.ok) {
      const statusMsg = apiStatus.ok 
        ? '✅ API connection restored' 
        : `❌ API connection lost${apiStatus.error ? ': ' + apiStatus.error : ''}`;
      setAnnounce(statusMsg);
      setApiFlash(true);
      setTimeout(() => setApiFlash(false), 2000);
    }
    prevApiRef.current = apiStatus.ok;
    }, [apiStatus.ok, apiStatus.error]);

  useEffect(() => {
    if (prevDbRef.current != null && prevDbRef.current !== dbStatus.ok) {
      const statusMsg = dbStatus.ok 
        ? '✅ Database connection restored' 
        : `❌ Database connection lost${dbStatus.error ? ': ' + dbStatus.error : ''}`;
      setAnnounce(statusMsg);
      setDbFlash(true);
      setTimeout(() => setDbFlash(false), 2000);
    }
    prevDbRef.current = dbStatus.ok;
    }, [dbStatus.ok, dbStatus.error]);

  return (
    <>
  <Paper
    elevation={0}
    className="app-header"
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 'var(--header-height)',
      position: { xs: 'relative', md: 'fixed' },
      top: 0,
      left: { xs: 0, md: 'var(--sidebar-width)' },
      right: 0,
      width: { xs: '100%', md: 'auto' },
      zIndex: 1200,
      backgroundColor: 'var(--accent-2)',
      color: 'var(--button-text)'
    }}
  >
  {/* title removed */}

        <Box display="flex" alignItems="center" gap={2} sx={{ pr: 4 }}>
          <TextField value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari..." size="small" variant="outlined" sx={{ minWidth: 180 }} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton size="small"><SearchIcon /></IconButton></InputAdornment>) }} />
        </Box>

        {/* right side: health indicators, notifications, theme switcher and logout */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 2 }}>
          {/* API / DB indicators with labels */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: apiStatus.ok ? 'var(--status-success)' : 'var(--status-error)' }}
                className={apiFlash ? (apiStatus.ok ? 'neon-pulse-green' : 'neon-pulse-red') : (apiStatus.ok ? 'neon-green' : 'neon-red')}
                aria-hidden
                title={apiStatus.lastCheck ? `Last check: ${new Date(apiStatus.lastCheck).toLocaleTimeString()}` : 'Checking...'}
              />
              <Box 
                component="span" 
                sx={{ fontSize: 12 }} 
                className={apiStatus.ok ? 'neon-text-green' : 'neon-text-red'}
                title={apiStatus.error || (apiStatus.lastCheck ? `Last check: ${new Date(apiStatus.lastCheck).toLocaleTimeString()}` : 'Checking...')}
              >
                API: {apiStatus.ok ? 'Connected' : (apiStatus.ok === null ? 'Checking...' : 'Disconnected')}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: dbStatus.ok ? 'var(--status-success)' : 'var(--status-error)' }}
                className={dbFlash ? (dbStatus.ok ? 'neon-pulse-green' : 'neon-pulse-red') : (dbStatus.ok ? 'neon-green' : 'neon-red')}
                aria-hidden
                title={dbStatus.lastCheck ? `Last check: ${new Date(dbStatus.lastCheck).toLocaleTimeString()}` : 'Checking...'}
              />
              <Box 
                component="span" 
                sx={{ fontSize: 12 }} 
                className={dbStatus.ok ? 'neon-text-green' : 'neon-text-red'}
                title={dbStatus.error || (dbStatus.lastCheck ? `Last check: ${new Date(dbStatus.lastCheck).toLocaleTimeString()}` : 'Checking...')}
              >
                DB: {dbStatus.ok ? 'Connected' : (dbStatus.ok === null ? 'Checking...' : 'Disconnected')}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                onClick={(e) => setSocketAnchor(e.currentTarget)}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: socketStatus.connected === true ? 'var(--status-success)' : (socketStatus.connected === null ? 'var(--status-muted)' : 'var(--status-error)'),
                  cursor: 'pointer'
                }}
                className={socketFlash ? (socketStatus.connected ? 'neon-pulse-green' : 'neon-pulse-red') : (socketStatus.connected ? 'neon-green' : (socketStatus.connected === null ? '' : 'neon-red'))}
                aria-hidden
                title="Socket status — click for details"
              />
              <Box 
                component="span" 
                sx={{ fontSize: 12, cursor: 'pointer' }} 
                onClick={(e) => setSocketAnchor(e.currentTarget)} 
                className={socketStatus.connected === true ? 'neon-text-green' : (socketStatus.connected === null ? '' : 'neon-text-red')}
                title="Click for socket details"
              >
                Socket: {socketStatus.connected === true ? 'Connected' : (socketStatus.connected === null ? 'Checking...' : 'Disconnected')}
              </Box>
              {/* socket popover removed (dev-only) */}
            </Box>
          </Box>

          {/* Notification badge (header) */}
          {!(location.pathname && location.pathname.startsWith('/invoice')) && (
            <>
              <Box sx={{  display: 'flex', alignItems: 'center', pr: 2 }}>
                <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); openCenter(); }} aria-label="Notifications" sx={{ color: 'var(--accent-2)' }}>
                  <Badge badgeContent={Math.max(0, unreadCount)} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
                  {/* quick action: mark all read from header */}
                <IconButton
                  size="small"
                  onClick={async () => {
                    const store = useNotificationStore.getState();
                    const prev = store.items;
                    // optimistic local update
                    store.markAllRead && store.markAllRead();
                    try {
                      await markAllAsRead();
                      // clear UI items after success
                      const s = useNotificationStore.getState();
                      s.clearItems && s.clearItems();
                    } catch {
                      // rollback: refetch items and unread count from server
                      try {
                        const res = await getNotifications({ limit: 50 });
                        const data = res?.data?.body_parsed ?? res?.data?.data ?? res?.data ?? [];
                        store.setItems(Array.isArray(data) ? data : []);
                        const unreadRes = await getUnreadCount();
                        const serverUnread = unreadRes?.data?.data?.unread ?? unreadRes?.data?.unread ?? 0;
                        store.setUnread(serverUnread);
                      } catch {
                        // ignore
                        store.setItems(Array.isArray(prev) ? prev : []);
                      }
                    }
                  }}
                  aria-label="Mark all read"
                  title="Mark all read"
                >
                  <DoneAllIcon />
                </IconButton>
              </Box>
              <NotificationsCenter open={notifOpen} onClose={() => { closeCenter(); setAnchorEl(null); }} anchorEl={anchorEl} />
            </>
          )}

          <ThemeSwitcher />
          <LogoutButton />

        </Box>

      </Paper>
      <span className="sr-only" aria-live="polite">{announce}</span>
      </>
    );
  }
