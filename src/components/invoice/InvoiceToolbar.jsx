import React from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';

export default function InvoiceToolbar({ noTransaksi, statusLabel, statusColor, onDownload, onPreview, customer }) {
  // Defensive: customer fields may be nested objects; ensure string rendering
  const extractString = (v) => {
    if (v == null) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'object') {
      // try common nested fields
      return v.name || v.nama || v.label || v.title || JSON.stringify(v);
    }
    return String(v);
  };

  const name = extractString(customer?.name ?? customer?.nama ?? customer?.nama_customer ?? customer?.customer_name ?? customer?.customer) || '-';
  const phone = extractString(customer?.phone ?? customer?.no_hp ?? customer?.customer_phone ?? customer?.telp) || '-';
  const address = extractString(customer?.address ?? customer?.alamat ?? customer?.customer_address ?? customer?.alamat_pengiriman) || '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Invoice</Typography>
          <Typography sx={{ mt: 0.5, color: '#6b7280' }}>No. {noTransaksi || '-'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label={statusLabel} color={statusColor} size="small" sx={{ fontWeight: 700 }} />
          <Button className="no-capture" variant="outlined" onClick={onPreview} sx={{ textTransform: 'none' }}>Preview</Button>
          <Button className="no-capture" variant="contained" onClick={onDownload} sx={{ textTransform: 'none' }}>Download PDF</Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', mt: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 700 }}>{name}</Typography>
          <Typography sx={{ color: '#6b7280', fontSize: 13 }}>{phone}</Typography>
        </Box>
        {address && (
          <Box sx={{ maxWidth: 520 }}>
            <Typography sx={{ color: '#6b7280', fontSize: 13 }}>{address}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
