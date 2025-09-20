import React, { useEffect } from 'react';
import useSocket from '../hooks/useSocket';

// Simple provider component: connects when token exists; resets unread when route to /payments
export default function SocketProvider({ children, url } = {}) {
  // Prefer explicit URL prop, then VITE_API_BASE_URL, then default to '/'
  const envUrl = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : undefined;
  const socketUrl = url || envUrl || undefined;
  const token = localStorage.getItem('token');
  const { connect, disconnect } = useSocket({ url: socketUrl });

  useEffect(() => {
    if (token) connect();
    return () => disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // No DOM output, just render children
  return (<>{children}</>);
}
