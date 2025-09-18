import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

export default function DashboardCharts({ salesData = [], ordersStatusData = [] }) {
  return (
    <Box sx={{ gridColumn: '1 / -1', gridRow: { xs: '4', md: '3' } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {/* Chart 1: Omzet (small line) */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'var(--panel)', borderRadius: '18px', boxShadow: `0 4px 12px 0 rgba(var(--accent-rgb),0.08), 0 2px 6px rgba(11,33,53,0.06)`, color: 'var(--text)', transition: 'box-shadow 0.18s, transform 0.18s', '&:hover': { boxShadow: `0 8px 24px 0 rgba(var(--accent-rgb),0.12), 0 4px 12px rgba(11,33,53,0.08)`, transform: 'translateY(-6px)' } }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1} sx={{ color: 'var(--accent-2)' }}>
            Omzet Mingguan
          </Typography>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#323447" vertical={false} />
              <XAxis dataKey="name" stroke="#9aa6d6" />
              <YAxis stroke="#9aa6d6" tickFormatter={v => `${(v/1000000).toFixed(0)}jt`} />
              <Tooltip wrapperStyle={{ background: '#111827', color: '#fff', borderRadius: 6 }} />
              <Line type="monotone" dataKey="omzet" stroke="#ffe066" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        {/* Chart 2: Orders (grouped bars) */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'var(--panel)', borderRadius: '18px', boxShadow: `0 4px 12px 0 rgba(59,130,246,0.08), 0 2px 6px rgba(11,33,53,0.06)`, color: 'var(--text)', transition: 'box-shadow 0.18s, transform 0.18s', '&:hover': { boxShadow: `0 8px 24px 0 rgba(59,130,246,0.12), 0 4px 12px rgba(11,33,53,0.08)`, transform: 'translateY(-6px)' } }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1} sx={{ color: 'var(--accent)' }}>
            Orders / Hari
          </Typography>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={ordersStatusData} margin={{ top: 5, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#2b2f45" />
              <XAxis dataKey="name" stroke="#9aa6d6" />
              <YAxis stroke="#9aa6d6" />
              <Tooltip wrapperStyle={{ background: '#111827', color: '#fff', borderRadius: 6, border: 'none' }} contentStyle={{ background: 'transparent', border: 'none' }} itemStyle={{ color: '#fff' }} />
              <Bar dataKey="selesai" fill="#22c55e" barSize={10} />
              <Bar dataKey="pending" fill="#f59e0b" barSize={10} />
              <Bar dataKey="belum" fill="#ef4444" barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* Chart 3: Payments (small line) */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'var(--panel)', borderRadius: '18px', boxShadow: `0 4px 12px 0 rgba(6,182,212,0.08), 0 2px 6px rgba(11,33,53,0.06)`, color: 'var(--text)', transition: 'box-shadow 0.18s, transform 0.18s', '&:hover': { boxShadow: `0 8px 24px 0 rgba(6,182,212,0.12), 0 4px 12px rgba(11,33,53,0.08)`, transform: 'translateY(-6px)' } }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1} sx={{ color: 'var(--accent)' }}>
            Payments (7d)
          </Typography>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={salesData.map((d, i) => ({ name: d.name, payments: (i % 3) + 1 }))} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#323447" vertical={false} />
              <XAxis dataKey="name" stroke="#9aa6d6" />
              <YAxis stroke="#9aa6d6" />
              <Tooltip wrapperStyle={{ background: '#111827', color: '#fff', borderRadius: 6 }} />
              <Line type="monotone" dataKey="payments" stroke="#60e7c6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </Box>
  );
}
