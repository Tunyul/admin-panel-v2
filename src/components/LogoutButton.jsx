
import React, { useState } from 'react';
import { styled, IconButton, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '../store/notificationStore';


const NeonIconButton = styled(IconButton)(({ theme }) => ({
  color: '#f472b6',
  filter: 'drop-shadow(0 0 6px #fbbf24) drop-shadow(0 0 12px #f472b6)',
  transition: 'filter 0.2s, color 0.2s',
  '&:hover': {
    color: '#fbbf24',
    filter: 'drop-shadow(0 0 12px #fbbf24) drop-shadow(0 0 24px #f472b6)',
    backgroundColor: 'transparent',
  },
}));

export default function LogoutButton() {
  const { showNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.removeItem('token');
      showNotification('Logout sukses!', 'info');
      navigate('/login');
    }, 5000);
  };

  return (
    <Tooltip title="Logout" arrow>
      <span>
        <NeonIconButton onClick={handleLogout} size="large" disabled={loading}>
          {loading ? (
            <svg width="28" height="28" viewBox="0 0 50 50" style={{ display: 'block' }}>
              <circle cx="25" cy="25" r="20" fill="none" stroke="#fbbf24" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
              </circle>
            </svg>
          ) : (
            <LogoutIcon fontSize="inherit" />
          )}
        </NeonIconButton>
      </span>
    </Tooltip>
  );
}
