import React, { useEffect, useState, useRef } from 'react';
import { Box, Fade, Backdrop, useTheme } from '@mui/material';
import useLoadingStore from '../store/loadingStore';

export default function PageTransition({ children, pathname }) {
  const theme = useTheme();
  const [showLoader, setShowLoader] = useState(false);
  const busy = useLoadingStore((s) => s.busy);
  const timeoutRef = useRef(null);
  const safetyRef = useRef(null);
  const lastPathRef = useRef(pathname);

  useEffect(() => {
    // ignore if same path or falsy
    if (!pathname || pathname === lastPathRef.current) return;

    lastPathRef.current = pathname;

    setShowLoader(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowLoader(false);
      timeoutRef.current = null;
    }, 1000);

    if (safetyRef.current) clearTimeout(safetyRef.current);
    safetyRef.current = setTimeout(() => {
      setShowLoader(false);
      safetyRef.current = null;
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (safetyRef.current) {
        clearTimeout(safetyRef.current);
        safetyRef.current = null;
      }
    };
  }, [pathname]);

  return (
    <Box sx={{ position: 'relative' }}>
      <Box>
        {children}
      </Box>

  {showLoader && (
        <Box
          role="presentation"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.48)',
            zIndex: (t) => t.zIndex.modal + 100,
            pointerEvents: 'auto',
            transition: 'opacity 180ms ease',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.palette.secondary.main, animation: 'pp 1s ease-in-out infinite' }} />
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.palette.secondary.main, animation: 'pp 1s ease-in-out infinite 0.12s' }} />
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.palette.secondary.main, animation: 'pp 1s ease-in-out infinite 0.24s' }} />
          </Box>
        </Box>
      )}

      <style>{`@keyframes pp { 0% { transform: scale(1); opacity: 0.6 } 50% { transform: scale(1.6); opacity: 1 } 100% { transform: scale(1); opacity: 0.6 } }`}</style>
    </Box>
  );
}
