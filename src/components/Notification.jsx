import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import useNotificationStore from '../store/notificationStore';

export default function NotificationBell() {
  const { open, message, severity, closeNotification } = useNotificationStore();

  return (
    <Snackbar open={open} autoHideDuration={4000} onClose={closeNotification} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Alert onClose={closeNotification} severity={severity} sx={{ width: '100%' }} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
}
