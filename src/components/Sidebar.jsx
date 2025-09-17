
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';


export default function Sidebar() {
  const location = useLocation();
  const menu = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Orders', path: '/orders', icon: <ListAltIcon /> },
    { label: 'Customers', path: '/customers', icon: <PeopleIcon /> },
    { label: 'Payments', path: '/payments', icon: <PaymentIcon /> },
    { label: 'Piutangs', path: '/piutangs', icon: <MonetizationOnIcon /> },
  ];
  return (
    <Box
      sx={{
        width: 220,
  background: 'none',
  color: '#fff',
  height: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
      }}
    >
      <List>
        {menu.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  background: '#23232b',
                  color: '#fbbf24',
                },
                '&:hover': {
                  background: '#23232b',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
