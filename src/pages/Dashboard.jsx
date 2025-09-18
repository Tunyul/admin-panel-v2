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


import React, { useEffect, useState, Suspense } from 'react';
import StatCard from '../components/StatCard';
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
// Recharts and chart rendering moved to a lazy chunk to reduce initial parse cost
const DashboardCharts = React.lazy(() => import('../components/DashboardCharts'));

import { getCustomers } from '../api/customers';
import { getProducts } from '../api/products';
import { getPayments } from '../api/payments';
import { getPiutangs } from '../api/piutangs';
import { getOrders } from '../api/orders';
import useLoadingStore from '../store/loadingStore';

// Dummy data
import PaymentsIcon from '@mui/icons-material/Payment';
import InventoryIcon from '@mui/icons-material/Inventory';

const DEFAULT_STATS = [
  { key: 'sales', title: 'Penjualan', value: '—', icon: <TrendingUpIcon />, color: 'bg-yellow-400' },
  { key: 'orders', title: 'Orders', value: '—', icon: <ShoppingCartIcon />, color: 'bg-blue-400' },
  { key: 'customers', title: 'Customers', value: '—', icon: <PeopleIcon />, color: 'bg-pink-400' },
  { key: 'payments', title: 'Payments', value: '—', icon: <PaymentsIcon />, color: 'bg-cyan-400' },
  { key: 'products', title: 'Products', value: '—', icon: <InventoryIcon />, color: 'bg-green-400' },
  { key: 'piutangs', title: 'Piutangs', value: '—', icon: <MonetizationOnIcon />, color: 'bg-purple-400' },
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
  if (process.env.NODE_ENV !== 'production') console.time('Dashboard:render');
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState({ customers: true, products: true, payments: true, piutangs: true, orders: true });

  // Shared card min width so Group A and Group B align consistently
  const CARD_MIN = 220; // px

  // Define two groups
  const groupAKeys = ['orders', 'products', 'customers', 'payments', 'piutangs'];
  const groupBKeys = ['uang_masuk', 'belum_dibayar', 'orders_selesai', 'orders_pending'];

  // Add placeholders for group B to stats if not present
  const GROUP_B_DEFAULTS = [
  { key: 'uang_masuk', title: 'Uang Masuk', value: '—', icon: <MonetizationOnIcon />, color: 'bg-yellow-400' },
  { key: 'belum_dibayar', title: 'Belum Dibayar', value: '—', icon: <PaymentsIcon />, color: 'bg-red-400' },
  { key: 'orders_selesai', title: 'Selesai', value: '—', icon: <TrendingUpIcon />, color: 'bg-green-400' },
  { key: 'orders_pending', title: 'Pending', value: '—', icon: <ShoppingCartIcon />, color: 'bg-blue-400' },
  ];

  const ordersStatusData = [
    { name: 'Sen', selesai: 8, pending: 2, belum: 1 },
    { name: 'Sel', selesai: 12, pending: 3, belum: 0 },
    { name: 'Rab', selesai: 7, pending: 1, belum: 2 },
    { name: 'Kam', selesai: 15, pending: 4, belum: 1 },
    { name: 'Jum', selesai: 11, pending: 2, belum: 0 },
    { name: 'Sab', selesai: 6, pending: 5, belum: 3 },
    { name: 'Min', selesai: 5, pending: 2, belum: 2 },
  ];

  useEffect(() => {
    // ensure group B entries exist in stats
    setStats((s) => {
      const keys = s.map(x => x.key);
      let res = [...s];
      GROUP_B_DEFAULTS.forEach((g) => {
        if (!keys.includes(g.key)) res.push(g);
      });
      return res;
    });
    // GROUP_B_DEFAULTS is static here; intentionally ignore exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  // Fetch customers count
    useLoadingStore.getState().start();
    getCustomers()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setStats((prev) => prev.map((s) => (s.key === 'customers' ? { ...s, value: Array.isArray(items) ? items.length : (items?.length || '—') } : s)));
      })
      .catch(() => {
        // keep placeholder
      })
      .finally(() => {
        setLoading((l) => ({ ...l, customers: false }));
        useLoadingStore.getState().done();
      });

  // Fetch products count
    useLoadingStore.getState().start();
    getProducts()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setStats((prev) => prev.map((s) => (s.key === 'products' ? { ...s, value: Array.isArray(items) ? items.length : (items?.length || '—') } : s)));
      })
      .catch(() => {})
      .finally(() => {
        setLoading((l) => ({ ...l, products: false }));
        useLoadingStore.getState().done();
      });

  // Fetch payments count
    useLoadingStore.getState().start();
    getPayments()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setStats((prev) => prev.map((s) => (s.key === 'payments' ? { ...s, value: Array.isArray(items) ? items.length : (items?.length || '—') } : s)));
      })
      .catch(() => {})
      .finally(() => {
        setLoading((l) => ({ ...l, payments: false }));
        useLoadingStore.getState().done();
      });

  // Fetch piutangs count
    useLoadingStore.getState().start();
    getPiutangs()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setStats((prev) => prev.map((s) => (s.key === 'piutangs' ? { ...s, value: Array.isArray(items) ? items.length : (items?.length || '—') } : s)));
      })
      .catch(() => {})
      .finally(() => {
        setLoading((l) => ({ ...l, piutangs: false }));
        useLoadingStore.getState().done();
      });

    // Fetch orders count
    useLoadingStore.getState().start();
    getOrders()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setStats((prev) => prev.map((s) => (s.key === 'orders' ? { ...s, value: Array.isArray(items) ? items.length : (items?.length || '—') } : s)));
      })
      .catch(() => {})
      .finally(() => {
        setLoading((l) => ({ ...l, orders: false }));
        useLoadingStore.getState().done();
      });
  }, []);

  if (process.env.NODE_ENV !== 'production') console.timeEnd('Dashboard:render');

  return (
    <Box
      sx={{
        width: '100%',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Box sx={{ width: '100%' }}>
        <style>{scrollbarStyle}</style>
        {/* Two-column layout (a1 left, a2 right) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 320px' }, gridAutoRows: 'auto', rowGap: 2, columnGap: 3, alignItems: 'start' }}>

          {/* a1: left column - contains a1-overview (top) and a1-finance (below) */}
          <Box sx={{ gridColumn: '1', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* a1-overview */}
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${CARD_MIN}px, 1fr))`, gap: '10px', alignItems: 'start', justifyItems: 'stretch', justifyContent: 'center' }}>
                <Typography sx={{ gridColumn: '1 / -1', color: '#ffe066', fontWeight: 700, mb: 1 }}>Overview</Typography>
                {stats.filter(s => groupAKeys.includes(s.key)).map((stat) => (
                  <div key={stat.key} style={{ width: '100%' }}>
                    <StatCard title={stat.title} value={loading[stat.key] ? <CircularProgress size={20} color="inherit" /> : stat.value} icon={stat.icon} color={stat.color} />
                  </div>
                ))}
              </Box>
            </Box>

            {/* a1-finance (below overview) */}
            <Box>
              <Typography sx={{ color: '#60a5fa', fontWeight: 700, mb: 1 }}>Finances & Orders</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', width: '100%' }}>
                {stats.filter(s => groupBKeys.includes(s.key)).map((stat) => (
                  <div key={stat.key} style={{ flex: `1 1 ${CARD_MIN}px`, minWidth: CARD_MIN }}>
                    <StatCard title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} />
                  </div>
                ))}
              </Box>
            </Box>
          </Box>

          {/* a2: right column - Aktivitas Terbaru */}
          <Box sx={{ gridColumn: { xs: '1', md: '2' } }}>
            <Paper elevation={0} sx={{ mt: 0, p: 3, bgcolor: 'rgba(35,41,70,0.95)', borderRadius: 4, boxShadow: '0 0 16px #60a5fa33', color: '#fff', width: { xs: '100%', md: 300 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ color: '#60a5fa', letterSpacing: 1 }}>
                Aktivitas Terbaru
              </Typography>
              <Box sx={{ overflowY: 'auto', maxHeight: { md: 360 } }}>
                <List>
                  {aktivitas.map((item, idx) => (
                    <ListItem key={idx} sx={{ py: 1 }}>
                      <ListItemText primary={item} primaryTypographyProps={{ sx: { color: '#fff', fontFamily: 'Poppins, Inter, Arial, sans-serif' } }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
              {/* Quick Actions */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#ffe066', fontWeight: 700, mb: 1 }}>Quick Actions</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Box sx={{ bgcolor: '#232946', p: 1, borderRadius: 1, cursor: 'pointer', boxShadow: '0 4px 10px #00000055' }}>New Order</Box>
                  <Box sx={{ bgcolor: '#232946', p: 1, borderRadius: 1, cursor: 'pointer', boxShadow: '0 4px 10px #00000055' }}>Add Customer</Box>
                  <Box sx={{ bgcolor: '#232946', p: 1, borderRadius: 1, cursor: 'pointer', boxShadow: '0 4px 10px #00000055' }}>Record Payment</Box>
                </Box>
              </Box>
              {/* System Info */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#60e7c6', fontWeight: 700, mb: 1 }}>System</Typography>
                <Typography sx={{ color: '#fff', fontSize: 13 }}>API: OK · DB: OK · Version: v1.6.5</Typography>
              </Box>
            </Paper>
          </Box>

          {/* Chart row: lazy-loaded charts to reduce initial parse */}
          <Suspense fallback={<div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading charts…</div>}>
            <DashboardCharts salesData={salesData} ordersStatusData={ordersStatusData} />
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}
