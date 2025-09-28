import React from 'react';
import { Box, Typography } from '@mui/material';
import { currency } from '../../utils/format';

export default function InvoiceSummary({ totalOrder = 0, totalPayments = 0, balance = 0 }) {
  return (
    <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 1 }}>
      <Typography>Total Pesanan: {currency(totalOrder)}</Typography>
      <Typography>Total Pembayaran: {currency(totalPayments)}</Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, mt: 1 }}>Sisa yang harus dibayar: {currency(Math.max(0, balance))}</Typography>
      {balance < 0 && (
        <Typography sx={{ color: '#6b7280', fontSize: 12 }}>Kelebihan pembayaran: {currency(Math.abs(balance))}</Typography>
      )}
    </Box>
  );
}
