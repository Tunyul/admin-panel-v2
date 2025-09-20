import LogoutButton from './LogoutButton';
import ThemeSwitcher from './ThemeSwitcher';

import React, { useState, useEffect, useRef } from 'react';
import NotificationBell from './Notification';
import { TextField, InputAdornment, IconButton, Box, Paper, Chip, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getApiHealth, getDbHealth } from '../api/health';

export default function Header() {
  const [search, setSearch] = useState('');
  const [apiStatus, setApiStatus] = useState({ ok: null, updatedAt: null });
  const [dbStatus, setDbStatus] = useState({ ok: null, updatedAt: null });
  const [announce, setAnnounce] = useState('');
  const [apiFlash, setApiFlash] = useState(false);
  const [dbFlash, setDbFlash] = useState(false);
  const prevApiRef = useRef(null);
  const prevDbRef = useRef(null);

  const checkHealth = async () => {
    try {
      const a = await getApiHealth();
      setApiStatus({ ok: a && (a.status >= 200 && a.status < 300), updatedAt: new Date(), body: a?.data || null });
    } catch (e) {
      setApiStatus({ ok: false, updatedAt: new Date(), body: null });
    }
    try {
      const d = await getDbHealth();
      setDbStatus({ ok: d && (d.status >= 200 && d.status < 300), updatedAt: new Date(), body: d?.data || null });
    } catch (e) {
      setDbStatus({ ok: false, updatedAt: new Date(), body: null });
    }
  };

  React.useEffect(() => {
    checkHealth();
    const t = setInterval(checkHealth, 10_000);
    return () => clearInterval(t);
  }, []);

  // announce and flash when api/db status changes
  useEffect(() => {
    if (prevApiRef.current !== apiStatus.ok) {
      if (prevApiRef.current !== null) {
        setAnnounce(`API ${apiStatus.ok ? 'online' : 'tidak terhubung'}`);
        setApiFlash(true);
        setTimeout(() => setApiFlash(false), 1200);
      }
      prevApiRef.current = apiStatus.ok;
    }
  }, [apiStatus.ok]);

  useEffect(() => {
    if (prevDbRef.current !== dbStatus.ok) {
      if (prevDbRef.current !== null) {
        setAnnounce(`Database ${dbStatus.ok ? 'online' : 'tidak terhubung'}`);
        setDbFlash(true);
        setTimeout(() => setDbFlash(false), 1200);
      }
      prevDbRef.current = dbStatus.ok;
    }
  }, [dbStatus.ok]);

    return (
      <>
      <style>{`
        /* Stronger neon preset: brighter glow and snappier pulse */
        @keyframes neonGreen {
          from { box-shadow: 0 0 2px rgba(16,185,129,0.48); }
          to { box-shadow: 0 0 32px rgba(16,185,129,0.72); }
        }
        @keyframes neonRed {
          from { box-shadow: 0 0 6px rgba(239,68,68,0.44); }
          to { box-shadow: 0 0 14px rgba(239,68,68,0.7); }
        }
        @keyframes neonPulseGreen {
          0% { transform: scale(1); box-shadow: 0 0 8px rgba(16,185,129,0.4); }
          50% { transform: scale(1.12); box-shadow: 0 0 26px rgba(16,185,129,0.86); }
          100% { transform: scale(1); box-shadow: 0 0 12px rgba(16,185,129,0.5); }
        }
        @keyframes neonPulseRed {
          0% { transform: scale(1); box-shadow: 0 0 6px rgba(239,68,68,0.38); }
          50% { transform: scale(1.12); box-shadow: 0 0 22px rgba(239,68,68,0.84); }
          100% { transform: scale(1); box-shadow: 0 0 8px rgba(239,68,68,0.44); }
        }
        .sr-only { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      `}</style>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'var(--panel)',
          height: 72,
          borderRadius: 0,
          boxShadow: 'none',
          border: 'none',
          mt: 0,
          mb: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          overflow: 'visible',
        }}
      >
        <h1
          className="text-3xl font-extrabold tracking-wide"
          style={{
            color: 'var(--accent)',
            fontFamily: 'Quicksand, Poppins, Comic Sans MS, Arial, sans-serif',
            paddingLeft: 32,
            letterSpacing: 2,
          }}
        >
          ehe
        </h1>
        <Box display="flex" alignItems="center" gap={2.5} sx={{ pr: 4 }}>
          <TextField
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari..."
            size="small"
            variant="outlined"
            sx={{
              minWidth: 180,
              bgcolor: 'var(--input-bg)',
              borderRadius: 3,
              input: {
                color: 'var(--text)',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontWeight: 500,
                letterSpacing: 1,
              },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f472b6' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fbbf24' },
              '& .MuiInputBase-root': { bgcolor: 'var(--input-bg)', borderRadius: 3 },
              '& .MuiInputAdornment-root': { color: '#fbbf24' },
              transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" sx={{ color: '#f472b6', transition: 'color 0.2s', '&:hover': { color: '#fbbf24' } }}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{
            bgcolor: 'var(--panel)',
            borderRadius: 2,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            transition: 'none',
          }}>
            <NotificationBell />
          </Box>
          <Box title={apiStatus.updatedAt ? `API: ${apiStatus.body?.status || (apiStatus.ok ? 'Healthy' : 'Unavailable')} (${apiStatus.updatedAt.toLocaleTimeString()})` : 'Checking API...'} sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <Box sx={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0, bgcolor: apiStatus.body?.status === 'ok' || apiStatus.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)' }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: apiStatus.body?.status === 'ok' || apiStatus.ok ? '#10B981' : '#EF4444', animation: `${apiFlash ? (apiStatus.body?.status === 'ok' || apiStatus.ok ? 'neonPulseGreen 1.0s ease-out' : 'neonPulseRed 1.0s ease-out') : ((apiStatus.body?.status === 'ok' || apiStatus.ok) ? 'neonGreen 2.4s infinite alternate' : 'neonRed 2.4s infinite alternate')}`, boxShadow: `${apiStatus.body?.status === 'ok' || apiStatus.ok ? '0 0 6px rgba(16,185,129,0.34)' : '0 0 6px rgba(239,68,68,0.32)'}` }} />
            </Box>
            <Box component="span" sx={{ ml: 0.6, color: 'var(--text-muted)', fontSize: 13 }}>API</Box>
          </Box>
          <Box title={dbStatus.updatedAt ? `DB: ${dbStatus.body?.db || (dbStatus.ok ? 'Healthy' : 'Unavailable')} (${dbStatus.updatedAt.toLocaleTimeString()})` : 'Checking DB...'} sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <Box sx={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0, bgcolor: dbStatus.body?.db === 'ok' || dbStatus.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)' }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: dbStatus.body?.db === 'ok' || dbStatus.ok ? '#10B981' : '#EF4444', animation: `${dbFlash ? (dbStatus.body?.db === 'ok' || dbStatus.ok ? 'neonPulseGreen 1.0s ease-out' : 'neonPulseRed 1.0s ease-out') : ((dbStatus.body?.db === 'ok' || dbStatus.ok) ? 'neonGreen 2.4s infinite alternate' : 'neonRed 2.4s infinite alternate')}`, boxShadow: `${dbStatus.body?.db === 'ok' || dbStatus.ok ? '0 0 6px rgba(16,185,129,0.34)' : '0 0 6px rgba(239,68,68,0.32)'}` }} />
            </Box>
            <Box component="span" sx={{ ml: 0.6, color: 'var(--text-muted)', fontSize: 13 }}>DB</Box>
          </Box>
          <ThemeSwitcher />
          <LogoutButton />
        </Box>
        {/* removed shadow-based glow animation to keep header flat */}
      </Paper>
  {/* aria-live announcer for screen readers (visually hidden) */}
  <span className="sr-only" aria-live="polite">{announce}</span>
      </>
    );

}
