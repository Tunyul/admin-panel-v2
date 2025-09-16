import React from 'react';
import { Button } from '@mui/material';
import useNotificationStore from '../store/notificationStore';
import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
  const { showNotification } = useNotificationStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    showNotification('Logout sukses!', 'info');
    navigate('/login');
  };

  return (
    <Button variant="outlined" color="error" onClick={handleLogout}>
      Logout
    </Button>
  );
}
