// Custom scrollbar style
const scrollbarStyle = `
  ::-webkit-scrollbar {
    width: 10px;
    background: #232946;
    border-radius: 8px;
  }
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(120deg, #ffe066 30%, #60a5fa 70%);
    border-radius: 8px;
    box-shadow: 0 0 8px #fbbf24cc;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(120deg, #fbbf24 30%, #3b82f6 70%);
  }
`;


import React from 'react';
import StatCard from '../components/StatCard';
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Dummy data
import PaymentsIcon from '@mui/icons-material/Payment';
import InventoryIcon from '@mui/icons-material/Inventory';

const stats = [
  { title: 'Total Penjualan', value: 'Rp 120.000.000', icon: <TrendingUpIcon />, color: 'bg-yellow-400' },
  { title: 'Total Order', value: '1.250', icon: <ShoppingCartIcon />, color: 'bg-blue-400' },
  { title: 'Total Pelanggan', value: '320', icon: <PeopleIcon />, color: 'bg-pink-400' },
  { title: 'Total Payments', value: '1.100', icon: <PaymentsIcon />, color: 'bg-cyan-400' },
  { title: 'Total Products', value: '85', icon: <InventoryIcon />, color: 'bg-green-400' },
  { title: 'Total Piutang', value: 'Rp 8.500.000', icon: <MonetizationOnIcon />, color: 'bg-purple-400' },
];

const salesData = [
  { name: 'Sen', omzet: 12000000 },
  { name: 'Sel', omzet: 15000000 },
  { name: 'Rab', omzet: 11000000 },
  { name: 'Kam', omzet: 17000000 },
  { name: 'Jum', omzet: 14000000 },
  { name: 'Sab', omzet: 9000000 },
  { name: 'Min', omzet: 8000000 },
];

const aktivitas = [
  'Order #INV-00125 telah dibayar',
  'Pelanggan baru: Budi Santoso',
  'Pembayaran #PAY-00987 menunggu konfirmasi',
  'Order #INV-00124 jatuh tempo besok',
];

export default function Dashboard() {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        p: { xs: 1, md: 2 },
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        overflowY: 'auto',
      }}
    >
      <style>{scrollbarStyle}</style>
      {/* Stat Cards */}
      <Grid container spacing={2}>
        {stats.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Grafik Penjualan */}
      <Paper elevation={0} sx={{ mt: 2, p: 3, bgcolor: 'rgba(35,41,70,0.95)', borderRadius: 4, boxShadow: '0 0 16px #fbbf2433', color: '#fff' }}>
        <Typography variant="h6" fontWeight={700} mb={2} sx={{ color: '#ffe066', letterSpacing: 1 }}>
          Grafik Omzet Mingguan
        </Typography>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" tickFormatter={v => `Rp${(v/1000000).toFixed(1)}jt`} />
            <Tooltip formatter={v => `Rp${v.toLocaleString()}`} labelStyle={{ color: '#232946' }} contentStyle={{ background: '#ffe066', color: '#232946', borderRadius: 8 }} />
            <Line type="monotone" dataKey="omzet" stroke="#ffe066" strokeWidth={3} dot={{ r: 5, fill: '#fbbf24' }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Aktivitas Terbaru */}
      <Paper elevation={0} sx={{ mt: 2, p: 3, bgcolor: 'rgba(35,41,70,0.95)', borderRadius: 4, boxShadow: '0 0 16px #60a5fa33', color: '#fff', maxWidth: 420 }}>
        <Typography variant="h6" fontWeight={700} mb={2} sx={{ color: '#60a5fa', letterSpacing: 1 }}>
          Aktivitas Terbaru
        </Typography>
        <List>
          {aktivitas.map((item, idx) => (
            <ListItem key={idx} sx={{ py: 1 }}>
              <ListItemText primary={item} primaryTypographyProps={{ sx: { color: '#fff', fontFamily: 'Poppins, Inter, Arial, sans-serif' } }} />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Fitur Baru */}
      <Paper elevation={0} sx={{ mt: 2, p: 3, bgcolor: 'rgba(35,41,70,0.95)', borderRadius: 4, boxShadow: '0 0 16px #f472b633', color: '#fff', maxWidth: 420 }}>
        <Typography variant="h6" fontWeight={700} mb={2} sx={{ color: '#f472b6', letterSpacing: 1 }}>
          Fitur Baru
        </Typography>
        <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
          - Export data ke Excel/CSV
        </Typography>
        <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
          - Integrasi notifikasi WhatsApp
        </Typography>
        <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
          - Dashboard mobile friendly
        </Typography>
        <Typography variant="body2" sx={{ color: '#e5e7eb', mt: 2 }}>
          *Fitur baru akan terus dikembangkan sesuai kebutuhan bisnis Anda.
        </Typography>
      </Paper>
    </Box>
  );
}
