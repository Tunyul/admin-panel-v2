import React from 'react';
import { Box, Table, TableHead, TableRow, TableCell, TableBody, Typography } from '@mui/material';
import { currency } from '../../utils/format';

export default function InvoicePayments({ payments = [] }) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography sx={{ fontWeight: 700, mb: 1 }}>Riwayat Pembayaran</Typography>
      <Table size="small" sx={{ borderCollapse: 'collapse' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ borderBottom: '2px solid #E5E7EB', fontWeight: 700 }}>ID</TableCell>
            <TableCell sx={{ borderBottom: '2px solid #E5E7EB', fontWeight: 700 }}>Tanggal</TableCell>
            <TableCell sx={{ borderBottom: '2px solid #E5E7EB', fontWeight: 700 }}>Nominal</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id_payment || p.id || JSON.stringify(p)}>
              <TableCell sx={{ borderBottom: '1px solid #E5E7EB' }}>{p.id_payment || p.id}</TableCell>
              <TableCell sx={{ borderBottom: '1px solid #E5E7EB' }}>{p.tanggal || p.created_at || '-'}</TableCell>
              <TableCell sx={{ borderBottom: '1px solid #E5E7EB' }}>{currency(p.nominal || p.amount || 0)}</TableCell>
            </TableRow>
          ))}
          {payments.length === 0 && (
            <TableRow><TableCell colSpan={3} sx={{ color: '#6b7280' }}>Belum ada pembayaran.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      <Typography sx={{ mt: 2, color: '#6b7280', fontSize: 12 }}>Gunakan tombol "Download PDF" untuk menyimpan atau mencetak bukti pembayaran.</Typography>
    </Box>
  );
}
