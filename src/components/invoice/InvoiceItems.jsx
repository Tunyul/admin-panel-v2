import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { currency } from '../../utils/format';

export default function InvoiceItems({ details = [] }) {
  return (
    <Table size="small" sx={{ borderCollapse: 'collapse' }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ borderBottom: '2px solid #E5E7EB', fontWeight: 700 }}>Item</TableCell>
          <TableCell sx={{ borderBottom: '2px solid #E5E7EB', fontWeight: 700 }}>Qty</TableCell>
          <TableCell sx={{ borderBottom: '2px solid #E5E7EB', fontWeight: 700 }}>Price</TableCell>
          <TableCell sx={{ borderBottom: '2px solid #E5E7EB', fontWeight: 700 }}>Total</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.isArray(details) && details.length > 0 ? details.map((d, i) => (
          <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
            <TableCell sx={{ borderBottom: '1px solid #E5E7EB' }}>
              {d.nama || d.product_name || d.name || d.sku || d.title || d.label || (d.product && (d.product.name || d.product.title)) || (d.produk && (d.produk.nama || d.produk.name)) || (d.item && (d.item.name || d.item.title)) || '-'}
            </TableCell>
            <TableCell sx={{ borderBottom: '1px solid #E5E7EB' }}>{d.quantity || d.qty || d.jumlah || d.q || 1}</TableCell>
            <TableCell sx={{ borderBottom: '1px solid #E5E7EB' }}>{currency(d.harga || d.price || d.unit_price || d.unitPrice || d.amount_unit || (d.product && d.product.price) || (d.produk && d.produk.harga) || 0)}</TableCell>
            <TableCell sx={{ borderBottom: '1px solid #E5E7EB' }}>{currency((Number(d.quantity || d.qty || d.jumlah || d.q || 1) * Number(d.harga || d.price || d.unit_price || d.unitPrice || d.amount_unit || 0)) || 0)}</TableCell>
          </TableRow>
        )) : (
          <TableRow><TableCell colSpan={4} sx={{ color: '#6b7280' }}>No order details provided.</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}
