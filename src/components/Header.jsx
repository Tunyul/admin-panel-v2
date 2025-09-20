import React, { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment, IconButton, Box, Paper, Badge } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useLocation } from 'react-router-dom';

import ThemeSwitcher from './ThemeSwitcher';
import LogoutButton from './LogoutButton';
import { getApiHealth, getDbHealth } from '../api/health';
import NotificationsCenter from './NotificationsCenter';
import useNotificationStore from '../store/notificationStore';

export default function Header() {
  const [search, setSearch] = useState('');
  const [apiStatus, setApiStatus] = useState({ ok: null });
  const [dbStatus, setDbStatus] = useState({ ok: null });
  const [announce, setAnnounce] = useState('');
  const prevApiRef = useRef(null);
  const prevDbRef = useRef(null);

  // const navigate = useNavigate();
  const location = useLocation();

  const [pendingCount, setPendingCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [apiFlash, setApiFlash] = useState(false);
  const [dbFlash, setDbFlash] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchPending = async () => {
      try {
        const mod = await import('../api/payments');
        const res = await mod.getPayments();
        const items = res?.data?.data || res?.data || [];
        const arr = Array.isArray(items) ? items : [];
        const pend = arr.filter((p) => !p.verified && !(p.status && p.status === 'approved'));
  if (!mounted) return;
  setPendingCount(pend.length);
      } catch {
        // ignore
      }
    };
    fetchPending();
    const id = setInterval(fetchPending, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const unreadCount = useNotificationStore((s) => s.unreadCount || 0);

  useEffect(() => {
    const check = async () => {
      try {
        const a = await getApiHealth();
        setApiStatus({ ok: Boolean(a && a.status >= 200 && a.status < 300) });
      } catch {
        setApiStatus({ ok: false });
      }
      try {
        const d = await getDbHealth();
        setDbStatus({ ok: Boolean(d && d.status >= 200 && d.status < 300) });
      } catch {
        setDbStatus({ ok: false });
      }
    };
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (prevApiRef.current != null && prevApiRef.current !== apiStatus.ok) {
      setAnnounce(apiStatus.ok ? 'API online' : 'API tidak terhubung');
      setApiFlash(true);
      setTimeout(() => setApiFlash(false), 1000);
    }
    prevApiRef.current = apiStatus.ok;
  }, [apiStatus.ok]);

  useEffect(() => {
    if (prevDbRef.current != null && prevDbRef.current !== dbStatus.ok) {
      setAnnounce(dbStatus.ok ? 'Database online' : 'Database tidak terhubung');
      setDbFlash(true);
      setTimeout(() => setDbFlash(false), 1000);
    }
    prevDbRef.current = dbStatus.ok;
  }, [dbStatus.ok]);

  return (
    <>
      <Paper elevation={0} sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'var(--panel)', height: 72, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200 }}>
        <h1 style={{ color: 'var(--accent)', paddingLeft: 24, letterSpacing: 1.5 }}>ehe</h1>

        <Box display="flex" alignItems="center" gap={2} sx={{ pr: 4 }}>
          <TextField value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari..." size="small" variant="outlined" sx={{ minWidth: 180 }} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton size="small"><SearchIcon /></IconButton></InputAdornment>) }} />

          {/* API / DB indicators with labels */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: apiStatus.ok ? 'var(--status-success)' : 'var(--status-error)' }}
                className={apiFlash ? (apiStatus.ok ? 'neon-pulse-green' : 'neon-pulse-red') : (apiStatus.ok ? 'neon-green' : 'neon-red')}
                aria-hidden
              />
              <Box component="span" sx={{ fontSize: 12 }} className={apiStatus.ok ? 'neon-text-green' : 'neon-text-red'}>
                API: {apiStatus.ok ? 'Terhubung' : (apiStatus.ok === null ? 'N/A' : 'Terputus')}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: dbStatus.ok ? 'var(--status-success)' : 'var(--status-error)' }}
                className={dbFlash ? (dbStatus.ok ? 'neon-pulse-green' : 'neon-pulse-red') : (dbStatus.ok ? 'neon-green' : 'neon-red')}
                aria-hidden
              />
              <Box component="span" sx={{ fontSize: 12 }} className={dbStatus.ok ? 'neon-text-green' : 'neon-text-red'}>
                DB: {dbStatus.ok ? 'Terhubung' : (dbStatus.ok === null ? 'N/A' : 'Terputus')}
              </Box>
            </Box>
          </Box>

          {/* Notification badge (header) */}
          {!(location.pathname && location.pathname.startsWith('/invoice')) && (
            <>
              <IconButton size="small" onClick={() => setNotifOpen(true)} aria-label="Notifications" sx={{ color: 'var(--accent-2)' }}>
                <Badge badgeContent={Math.max(0, pendingCount + unreadCount)} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <NotificationsCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
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
