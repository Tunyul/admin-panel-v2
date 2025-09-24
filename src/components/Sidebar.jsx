
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
import InventoryIcon from '@mui/icons-material/Inventory';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SettingsIcon from '@mui/icons-material/Settings';


export default function Sidebar() {
  const location = useLocation();
  const menu = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon />, color: '#ffe066' }, // kuning soft
    { label: 'Orders', path: '/orders', icon: <ListAltIcon />, color: '#60a5fa' }, // biru soft
    { label: 'Products', path: '/products', icon: <InventoryIcon />, color: '#34d399' }, // hijau soft (gunakan InventoryIcon)
    { label: 'Customers', path: '/customers', icon: <PeopleIcon />, color: '#f9a8d4' }, // pink soft
    { label: 'Payments', path: '/payments', icon: <PaymentIcon />, color: '#67e8f9' }, // cyan soft
    { label: 'Piutangs', path: '/piutangs', icon: <MonetizationOnIcon />, color: '#c4b5fd' }, // ungu soft
  ];
  return (
    <Box
      className="app-sidebar"
      sx={{
        width: { xs: '100%', md: '180px' },
        position: { xs: 'relative', md: 'fixed' },
        left: { xs: 0, md: 0 },
        top: { xs: 0, md: 'var(--header-height)' },
        alignSelf: 'flex-start',
        height: { xs: 'auto', md: 'calc(100vh - var(--header-height))' },
        color: 'var(--text)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        boxShadow: 'none',
        border: 'none',
        margin: 0,
        padding: 0,
        fontFamily: 'Poppins, Inter, Arial, sans-serif',
        transition: 'width 200ms ease, transform 180ms ease',
        zIndex: 1100,
      }}
    >
  <List className="modal-scroll" sx={{ width: '100%', overflowY: { xs: 'visible', md: 'auto' }, flex: 1 }}>
        {menu.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 0,
                mx: 1,
                py: 0.75,
                px: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: 0.4,
                color: location.pathname === item.path ? item.color : '#e5e7eb',
                background: location.pathname === item.path ? 'none' : 'none',
                boxShadow: 'none',
                borderLeft: location.pathname === item.path ? `4px solid ${item.color}` : '4px solid transparent',
                /* make list items update instantly when theme toggles */
                transition: 'none',
                '&:hover': {
                  background: `${item.color}12`,
                  color: item.color,
                  transform: 'none',
                },
                '& .MuiListItemIcon-root': {
                  minWidth: 0,
                  mr: 1,
                  fontSize: 18,
                  color: location.pathname === item.path ? item.color : item.color + '99',
                  filter: 'none',
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
                    fontWeight: 600,
                    fontSize: 14,
                    letterSpacing: 0.4,
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
