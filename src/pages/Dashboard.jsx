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


import React, { useEffect, useState, Suspense, useRef } from 'react';
import StatCard from '../components/StatCard';
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, CircularProgress, Button, ButtonBase } from '@mui/material';
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
import useNotificationStore from '../store/notificationStore';
import Tooltip from '@mui/material/Tooltip';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useNavigate } from 'react-router-dom';
import ListAltIcon from '@mui/icons-material/ListAlt';
import QuickActionModals from '../components/QuickActionModals';

// Dummy data
import PaymentsIcon from '@mui/icons-material/Payment';
import InventoryIcon from '@mui/icons-material/Inventory';

// Inline neon button used for Quick Actions — small, friendly, modern neon style
function ButtonNeon({ children, startIcon, sx, variantColor = 'blue', pill = true, ...rest }) {
  const colorMap = {
    blue: { glow: '96,165,250', bg: 'rgba(40,40,55,0.6)' },
    yellow: { glow: '255,224,102', bg: 'rgba(50,40,35,0.6)' },
    pink: { glow: '236,72,153', bg: 'rgba(45,30,45,0.6)' },
    teal: { glow: '20,184,166', bg: 'rgba(20,40,40,0.6)' },
  };
  const pick = colorMap[variantColor] || colorMap.blue;
  return (
    <Button
      startIcon={startIcon}
      {...rest}
      sx={{
        color: '#fff',
        borderRadius: pill ? 999 : 1,
        px: pill ? 2 : 1.5,
        py: pill ? 0.8 : 0.6,
        textTransform: 'none',
        fontWeight: 600,
        fontSize: 14,
        boxShadow: `0 8px 26px rgba(${pick.glow},0.08), 0 0 22px rgba(${pick.glow},0.06) inset`,
        background: `linear-gradient(135deg, ${pick.bg}, rgba(20,20,30,0.6))`,
        border: `1px solid rgba(${pick.glow},0.08)`,
        transition: 'transform 160ms cubic-bezier(.2,.9,.2,1), box-shadow 160ms ease',
        '&:hover': {
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: `0 14px 36px rgba(${pick.glow},0.22), 0 0 34px rgba(${pick.glow},0.14) inset`,
          background: `linear-gradient(135deg, ${pick.bg}, rgba(10,10,15,0.78))`,
        },
        '& .MuiButton-startIcon': {
          marginRight: 10,
          color: `rgba(${pick.glow},0.95)`,
          fontSize: 18,
        },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}

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
  if (import.meta.env.DEV) console.time('Dashboard:render');
  const [stats, setStats] = useState(DEFAULT_STATS);
  const notify = useNotificationStore((s) => s.showNotification);
  const navigate = useNavigate();
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

  // Quick Actions handlers
  const refreshCounts = async () => {
    try {
      useLoadingStore.getState().start();
      notify('Refreshing counts…', 'info');
      const [cP, pP, payP, piuP, oP] = await Promise.all([getCustomers(), getProducts(), getPayments(), getPiutangs(), getOrders()]);
      const mapLen = (r) => (Array.isArray(r?.data?.data) ? r.data.data.length : (r?.data?.length || '—'));
      setStats((prev) => prev.map((s) => {
        if (s.key === 'customers') return { ...s, value: mapLen(cP) };
        if (s.key === 'products') return { ...s, value: mapLen(pP) };
        if (s.key === 'payments') return { ...s, value: mapLen(payP) };
        if (s.key === 'piutangs') return { ...s, value: mapLen(piuP) };
        if (s.key === 'orders') return { ...s, value: mapLen(oP) };
        return s;
      }));
    } catch {
      notify('Failed to refresh counts', 'error');
    } finally {
      useLoadingStore.getState().done();
    }
  };

  // Lazy-mount wrapper for heavy charts — uses IntersectionObserver to defer rendering
  function ChartLazyMount({ children }) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
      if (!ref.current) return;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) setInView(true); });
      }, { rootMargin: '300px' });
      obs.observe(ref.current);
      return () => obs.disconnect();
    }, [ref]);

    return <div ref={ref}>{inView ? children : <div style={{ height: 240 }} />}</div>;
  }

  const exportStatsCsv = () => {
    const rows = stats.map((s) => ({ key: s.key, title: s.title, value: s.value }));
    const csv = ['key,title,value', ...rows.map(r => `${r.key},"${r.title}",${r.value}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-stats.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('CSV exported', 'success');
  };

  const goProducts = () => navigate('/products');
  const goOrders = () => navigate('/orders');

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

  if (import.meta.env.DEV) console.timeEnd('Dashboard:render');

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

                {/* Duplicate Quick Actions removed (kept under Finances & Orders) */}

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

                {/* Quick Actions — moved here under Finances & Orders */}
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Box sx={{ p: 0, borderRadius: 3, color: '#fff', width: '100%' }}>
                    <Typography variant="subtitle2" sx={{ color: '#ffe066', fontWeight: 700, mb: 1 }}>Quick Actions</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                      {[
                        { key: 'new-order', title: 'New Order', icon: <ShoppingCartIcon />, color: 'yellow', onClick: () => { const el = document.getElementById('qa-open-new-order'); if (el) el.click(); else notify('Open new order (not wired)', 'info'); } },
                        { key: 'add-customer', title: 'Add Customer', icon: <PeopleIcon />, color: 'pink', onClick: () => { const el = document.getElementById('qa-open-add-customer'); if (el) el.click(); else notify('Open add customer (not wired)', 'info'); } },
                        { key: 'record-payment', title: 'Record Payment', icon: <PaymentsIcon />, color: 'teal', onClick: () => { const el = document.getElementById('qa-open-record-payment'); if (el) el.click(); else notify('Open record payment (not wired)', 'info'); } },
                        { key: 'refresh', title: 'Refresh', icon: <RefreshIcon />, color: 'blue', onClick: refreshCounts },
                        { key: 'export', title: 'Export CSV', icon: <FileDownloadIcon />, color: 'blue', onClick: exportStatsCsv },
                        { key: 'products', title: 'Products', icon: <ListAltIcon />, color: 'teal', onClick: goProducts },
                        { key: 'orders', title: 'Orders', icon: <ShoppingCartIcon />, color: 'yellow', onClick: goOrders },
                        { key: 'setup', title: 'Setup', icon: <DarkModeIcon />, color: 'teal', onClick: () => { if (typeof navigate === 'function') navigate('/setup'); else notify('Open setup (not wired)', 'info'); } },
                      ].map((b) => {
                        const accentMap = { yellow: '#fbbf24', pink: '#f472b6', teal: '#06b6d4', blue: '#3b82f6' };
                        const accent = accentMap[b.color] || '#3b82f6';
                        return (
                          <ButtonBase
                            key={b.key}
                            onClick={b.onClick}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.onClick(); } }}
                            aria-label={`Quick action ${b.title}`}
                            focusRipple
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 2,
                              bgcolor: '#232946',
                              borderRadius: '18px',
                              width: '100%',
                              textAlign: 'left',
                              justifyContent: 'flex-start',
                              border: '1px solid rgba(255,255,255,0.02)',
                              boxShadow: `0 4px 12px 0 ${accent}22, 0 2px 6px #00000055`,
                              transition: 'box-shadow 0.18s, transform 0.18s',
                              '&:hover': { boxShadow: `0 14px 36px ${accent}33, 0 4px 12px #00000066`, transform: 'translateY(-6px)' },
                              '&.Mui-focusVisible': { outline: `2px solid ${accent}33`, boxShadow: `0 14px 36px ${accent}33` },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', bgcolor: `${accent}15`, color: accent, boxShadow: `0 6px 18px ${accent}10` }}>
                              {b.icon}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ color: '#fff', fontWeight: 700 }}>{b.title}</Typography>
                            </Box>
                          </ButtonBase>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
          </Box>

          {/* a2: right column - Aktivitas Terbaru + separate Quick Actions & System */}
          <Box sx={{ gridColumn: { xs: '1', md: '2' }, display: 'flex', flexDirection: 'column', gap: 2, width: { xs: '100%', md: 300 } }}>
            <Paper elevation={0} sx={{ mt: 0, p: 3, bgcolor: 'rgba(35,41,70,0.95)', borderRadius: 4, boxShadow: '0 0 16px #60a5fa33', color: '#fff', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ color: '#60a5fa', letterSpacing: 1 }}>
                Aktivitas Terbaru
              </Typography>
              <Box sx={{ overflowY: 'auto', maxHeight: { md: 260 } }}>
                <List>
                  {aktivitas.map((item, idx) => (
                    <ListItem key={idx} sx={{ py: 1 }}>
                      <ListItemText primary={item} primaryTypographyProps={{ sx: { color: '#fff', fontFamily: 'Poppins, Inter, Arial, sans-serif' } }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>

            {/* Quick Actions removed from here (moved under Overview) */}

            {/* System Info - separate card */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(35,41,70,0.95)', borderRadius: 4, boxShadow: '0 0 12px #00000033', color: '#fff' }}>
              <Typography variant="subtitle2" sx={{ color: '#60e7c6', fontWeight: 700, mb: 1 }}>System</Typography>
              <Typography sx={{ color: '#fff', fontSize: 13 }}>API: OK · DB: OK · Version: v1.6.9</Typography>
            </Paper>
          </Box>

          {/* Chart row: lazy-loaded charts to reduce initial parse */}
          <Suspense fallback={<div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading charts…</div>}>
            <DashboardCharts salesData={salesData} ordersStatusData={ordersStatusData} />
          </Suspense>
        </Box>
  <QuickActionModals onNotify={notify} onSuccess={refreshCounts} />
      </Box>
    </Box>
  );
}
