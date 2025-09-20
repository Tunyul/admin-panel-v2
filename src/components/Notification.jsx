import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Badge, IconButton } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import useNotificationStore from '../store/notificationStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPayments } from '../api/payments';

export default function NotificationBell() {
  const { open, message, severity, closeNotification } = useNotificationStore();
  const [pendingCount, setPendingCount] = useState(0);
  const [firstPendingId, setFirstPendingId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const fetchPending = () => {
      getPayments()
        .then((res) => {
          const items = res?.data?.data || res?.data || [];
          const arr = Array.isArray(items) ? items : [];
          const pend = arr.filter((p) => !p.verified && !(p.status && p.status === 'approved'));
          if (!mounted) return;
          setPendingCount(pend.length);
          setFirstPendingId(pend.length ? (pend[0].id_payment || pend[0].id) : null);
        })
        .catch(() => {});
    };
    fetchPending();
    const t = setInterval(fetchPending, 15000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  return (
    <>
      {/* hide bell on public invoice pages to keep view minimal */}
      {!(location.pathname && location.pathname.startsWith('/invoice')) && (
        <IconButton size="small" onClick={() => { if (firstPendingId) navigate(`/payments?open_verify=${firstPendingId}`); else navigate('/payments'); }} sx={{ color: 'inherit' }}>
          <Badge badgeContent={pendingCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      )}
      <Snackbar open={open} autoHideDuration={4000} onClose={closeNotification} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={closeNotification} severity={severity} sx={{ width: '100%' }} variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </>
  );
}
