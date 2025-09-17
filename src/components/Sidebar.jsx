
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
    { label: 'Dashboard', path: '/', icon: <DashboardIcon />, color: '#ffe066' }, // kuning soft
    { label: 'Orders', path: '/orders', icon: <ListAltIcon />, color: '#60a5fa' }, // biru soft
    { label: 'Products', path: '/products', icon: <PaymentIcon />, color: '#34d399' }, // hijau soft (gunakan PaymentIcon, bisa diganti)
    { label: 'Customers', path: '/customers', icon: <PeopleIcon />, color: '#f9a8d4' }, // pink soft
    { label: 'Payments', path: '/payments', icon: <PaymentIcon />, color: '#67e8f9' }, // cyan soft
    { label: 'Piutangs', path: '/piutangs', icon: <MonetizationOnIcon />, color: '#c4b5fd' }, // ungu soft
  ];
  return (
    <Box
      sx={{
        width: 230,
        minHeight: '100vh',
  background: 'none',
        color: '#fff',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
  boxShadow: 'none',
  margin: 0,
  padding: 0,
  fontFamily: 'Poppins, Inter, Arial, sans-serif',
        transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
      }}
    >
      <List sx={{ width: '100%' }}>
        {menu.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 1.5 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 0,
                mx: 2,
                py: 1.5,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: 1,
                color: location.pathname === item.path ? item.color : '#e5e7eb',
                background: location.pathname === item.path ? 'none' : 'none',
                boxShadow: 'none',
                borderLeft: location.pathname === item.path ? `5px solid ${item.color}` : '5px solid transparent',
                transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
                '&:hover': {
                  background: `${item.color}18`,
                  color: item.color,
                  boxShadow: `0 0 6px ${item.color}66`,
                  transform: 'scale(1.03)',
                },
                '& .MuiListItemIcon-root': {
                  minWidth: 0,
                  mr: 2,
                  fontSize: 26,
                  color: location.pathname === item.path ? item.color : item.color + '99',
                  filter: location.pathname === item.path ? `drop-shadow(0 0 4px ${item.color}88)` : `drop-shadow(0 0 2px ${item.color}44)` ,
                  transition: 'color 0.2s, filter 0.2s',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  sx: {
                    fontFamily: 'Poppins, Inter, Arial, sans-serif',
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: 1,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
