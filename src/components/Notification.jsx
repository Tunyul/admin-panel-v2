import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import useNotificationStore from '../store/notificationStore';

export default function Notification() {
  const { open, message, severity, closeNotification } = useNotificationStore();

  // Only render the Snackbar/Alert. The interactive bell was removed because
  // it floated separately on every page (bottom-left) and interfered with layout.
  return (
    <Snackbar open={open} autoHideDuration={4000} onClose={closeNotification} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Alert onClose={closeNotification} severity={severity} sx={{ width: '100%' }} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
}
