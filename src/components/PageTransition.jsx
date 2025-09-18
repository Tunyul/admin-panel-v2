import React, { useEffect, useState, useRef } from 'react';
import { Box, Fade, Backdrop, CircularProgress, useTheme } from '@mui/material';

// Lightweight page transition loader:
// - When `pathname` changes, show a smooth backdrop + spinner for 3 seconds,
//   then render the new children. Keeps animations in CSS and MUI to avoid stutter.
export default function PageTransition({ children, pathname }) {
  const theme = useTheme();
  const [showLoader, setShowLoader] = useState(false);
  const [activePath, setActivePath] = useState(pathname);
  const timeoutRef = useRef(null);
  const safetyRef = useRef(null);
  const lastPathRef = useRef(pathname);

  useEffect(() => {
    // Only trigger when the pathname actually changes compared to lastPathRef.
    if (!pathname || pathname === lastPathRef.current) return;

    lastPathRef.current = pathname;

    // Immediately allow children to update to the new path
    if (pathname !== activePath) setActivePath(pathname);

    // show loader for a brief period (1s)
    setShowLoader(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowLoader(false);
      timeoutRef.current = null;
    }, 1000);

    // safety: ensure loader can't stay visible > 3s
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
      {/* Always render children; overlay will sit on top during loading to avoid blanking */}
      <Box>
        {children}
      </Box>

      {/* overlay limited to this component's box (main content) */}
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
            // dark transparent backdrop to dim the whole page (no washed white)
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.48)',
            zIndex: (t) => t.zIndex.modal + 100,
            // block interactions while loading
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
