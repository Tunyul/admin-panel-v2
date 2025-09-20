import React, { useEffect } from 'react';
import useSocket from '../hooks/useSocket';

// Simple provider component: connects when token exists; resets unread when route to /payments
export default function SocketProvider({ children, url } = {}) {
  const token = localStorage.getItem('token');
  const { connect, disconnect } = useSocket({ url });

  useEffect(() => {
    if (token) connect();
    return () => disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // No DOM output, just render children
  return (<>{children}</>);
}
