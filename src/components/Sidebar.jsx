import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Avatar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PaymentIcon from '@mui/icons-material/Payment';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Products', icon: <ShoppingCartIcon />, path: '/products' },
  { text: 'Orders', icon: <AssignmentIcon />, path: '/orders' },
  { text: 'Piutangs', icon: <AssignmentIcon />, path: '/piutangs' },
  { text: 'Payments', icon: <PaymentIcon />, path: '/payments' },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <Drawer
      variant="permanent"
      PaperProps={{
        sx: {
          backgroundColor: '#18181b',
          color: '#fff',
          width: 240,
          borderRight: 'none',
        },
      }}
    >
      <div className="flex flex-col items-center py-8">
        <Avatar src="https://randomuser.me/api/portraits/men/32.jpg" sx={{ width: 64, height: 64, mb: 2 }} />
        <div className="font-bold text-lg mb-1">Ghulam</div>
        <div className="text-xs text-gray-400 mb-6">Product Designer</div>
      </div>
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            sx={{
              mb: 1,
              borderRadius: 2,
              backgroundColor:
                location.pathname === item.path ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: location.pathname === item.path ? '#3b82f6' : '#fff',
              '&:hover': {
                backgroundColor: 'rgba(59,130,246,0.10)',
                color: '#3b82f6',
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? '#3b82f6' : '#fff' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
