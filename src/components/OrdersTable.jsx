import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Collapse,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/InfoOutlined';

function OrderRow({ row, expanded, detailsMap, detailsLoading, onOpen, onDelete, onExpand, productsList, customersMap }) {
  const openWhatsApp = (phone) => {
    if (!phone) return;
    // normalize phone: remove non-digit/+ chars
    let normalized = String(phone || '').replace(/[^+\d]/g, '');
    if (!normalized) return;
    // remove leading + if present, we'll build wa.me without plus
    if (normalized.startsWith('+')) normalized = normalized.slice(1);
    // if number starts with 0 (local), convert to Indonesian +62
    if (normalized.startsWith('0')) normalized = '62' + normalized.slice(1);
    const url = `https://wa.me/${normalized}`;
    window.open(url, '_blank', 'noopener');
  };
  return (
    <>
      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(96,165,250,0.08)' } }}>
        <TableCell sx={{ color: '#fff' }}>{row.no_transaksi || '-'}</TableCell>
        <TableCell sx={{ color: '#fff' }}>{row.customer?.nama || customersMap[row.id_customer]?.nama || '-'}</TableCell>
        <TableCell sx={{ color: '#fff' }}>
          {(() => {
            const phoneRaw = row.customer?.phone || row.customer?.no_hp || customersMap[row.id_customer]?.phone || customersMap[row.id_customer]?.no_hp || '';
            const phoneDisplay = phoneRaw || '-';
            if (!phoneRaw) return phoneDisplay;
            // build normalized number for href as done in openWhatsApp
            let normalized = String(phoneRaw || '').replace(/[^+\d]/g, '');
            if (normalized.startsWith('+')) normalized = normalized.slice(1);
            if (normalized.startsWith('0')) normalized = '62' + normalized.slice(1);
            const waHref = `https://wa.me/${normalized}`;
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="a" href={waHref} target="_blank" rel="noopener noreferrer" sx={{ color: '#fff', textDecoration: 'none' }} aria-label={`WhatsApp ${phoneDisplay}`}>
                  <Typography sx={{ color: '#fff' }}>{phoneDisplay}</Typography>
                </Box>
                <IconButton size="small" onClick={() => openWhatsApp(phoneRaw)} aria-label="open-whatsapp" sx={{ color: '#25D366' }}>
                  {/* WhatsApp SVG */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.373 0 .012 5.373 0 12c0 2.11.553 4.18 1.6 6.02L0 24l6.24-1.62A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-3.2-1.25-6.2-3.48-8.52z" fill="#25D366"/>
                    <path d="M17.56 14.1c-.36-.18-2.12-1.05-2.44-1.17-.32-.12-.55-.18-.78.18-.23.36-.9 1.17-1.1 1.41-.2.24-.4.27-.76.09-.36-.18-1.52-.56-2.9-1.79-1.07-.95-1.8-2.12-2.01-2.48-.21-.36-.02-.56.16-.74.16-.16.36-.41.54-.62.18-.2.24-.36.36-.6.12-.24.06-.44-.03-.62-.09-.18-.78-1.88-1.07-2.57-.28-.66-.56-.57-.78-.58-.2-.01-.44-.01-.68-.01-.23 0-.6.09-.92.44-.32.36-1.22 1.18-1.22 2.88 0 1.7 1.25 3.35 1.42 3.58.18.24 2.46 3.76 5.96 5.27 3.5 1.5 3.5 1.03 4.13.97.63-.06 2.02-.82 2.31-1.62.28-.8.28-1.48.2-1.62-.09-.14-.32-.18-.68-.36z" fill="#fff"/>
                  </svg>
                </IconButton>
              </Box>
            );
          })()}
        </TableCell>
        <TableCell sx={{ color: '#ffe066' }}>{row.tanggal_order ? new Date(row.tanggal_order).toLocaleString('id-ID') : '-'}</TableCell>
        <TableCell>
          <Chip label={row.status_urgensi || '-'} size="small" sx={{ bgcolor: row.status_urgensi === 'urgent' ? '#f87171' : '#60a5fa', color: '#fff', fontWeight: 700 }} />
        </TableCell>
        <TableCell sx={{ color: '#34d399', fontWeight: 700 }}>{row.total_bayar ? `Rp${Number(row.total_bayar).toLocaleString('id-ID')}` : '-'}</TableCell>
        <TableCell>
          <Chip label={row.status_bayar || '-'} size="small" sx={{ bgcolor: row.status_bayar === 'lunas' ? '#34d399' : '#fbbf24', color: '#232946', fontWeight: 700 }} />
        </TableCell>
        <TableCell sx={{ color: '#60a5fa' }}>{row.tanggal_jatuh_tempo ? new Date(row.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : '-'}</TableCell>
        <TableCell>
          <Chip label={row.status_order || '-'} size="small" sx={{ bgcolor: row.status_order === 'proses' ? '#60a5fa' : '#a78bfa', color: '#fff', fontWeight: 700 }} />
        </TableCell>
        <TableCell>
          <Chip label={row.status || '-'} size="small" sx={{ bgcolor: row.status === 'pending' ? '#fbbf24' : row.status === 'proses' ? '#60a5fa' : row.status === 'selesai' ? '#34d399' : '#f87171', color: '#232946', fontWeight: 700 }} />
        </TableCell>
        <TableCell>
          <IconButton color="primary" onClick={() => onOpen(row)}><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => onDelete(row.id_order)}><DeleteIcon /></IconButton>
          <IconButton color="info" onClick={() => onExpand(row.id_order)}><InfoIcon /></IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={11} sx={{ p: 0, border: 0, bgcolor: 'transparent' }}>
          <Collapse in={expanded === row.id_order} timeout="auto" unmountOnExit>
            <Box sx={{ bgcolor: 'rgba(35,41,70,0.95)', borderRadius: 2, p: 2, mt: 1, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#60a5fa', fontWeight: 700, mb: 1 }}>Order Details</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#f472b6', fontWeight: 700 }}>Produk</TableCell>
                    <TableCell sx={{ color: '#34d399', fontWeight: 700 }}>Qty</TableCell>
                    <TableCell sx={{ color: '#ffe066', fontWeight: 700 }}>Harga Satuan</TableCell>
                    <TableCell sx={{ color: '#a78bfa', fontWeight: 700 }}>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detailsMap[row.id_order] || row.details || []).map((d) => {
                    const prodName = d.produk?.nama || d.produk?.nama_produk || (() => {
                      const pid = d.produk_id || d.id_produk || d.id_produk;
                      if (!pid) return '-';
                      const found = productsList.find((p) => String(p.id_produk || p.id) === String(pid));
                      return found ? (found.nama_produk || found.nama) : `Produk #${pid}`;
                    })();
                    return (
                      <TableRow key={d.id}>
                        <TableCell sx={{ color: '#fff' }}>{prodName}</TableCell>
                        <TableCell sx={{ color: '#34d399', fontWeight: 700 }}>{d.quantity || '-'}</TableCell>
                        <TableCell sx={{ color: '#ffe066' }}>{d.harga_satuan ? `Rp${Number(d.harga_satuan).toLocaleString('id-ID')}` : '-'}</TableCell>
                        <TableCell sx={{ color: '#a78bfa' }}>{d.subtotal_item ? `Rp${Number(d.subtotal_item).toLocaleString('id-ID')}` : '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                  {detailsLoading[row.id_order] && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: '#60a5fa', fontStyle: 'italic' }}>
                        Loading details...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {row.catatan && (
                <Typography variant="body2" sx={{ color: '#fbbf24', mt: 2 }}>
                  Catatan: {row.catatan}
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function OrdersTable(props) {
  const { data, expanded, detailsMap, detailsLoading, onOpen, onDelete, onExpand, productsList, customersMap } = props;
  return (
    <Table>
      <TableHead>
        <TableRow sx={{ bgcolor: 'rgba(35,41,70,0.95)' }}>
          <TableCell sx={{ color: '#60a5fa', fontWeight: 700 }}>No Transaksi</TableCell>
          <TableCell sx={{ color: '#f472b6', fontWeight: 700 }}>Customer</TableCell>
          <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Phone</TableCell>
          <TableCell sx={{ color: '#ffe066', fontWeight: 700 }}>Tanggal Order</TableCell>
          <TableCell sx={{ color: '#a78bfa', fontWeight: 700 }}>Status Urgensi</TableCell>
          <TableCell sx={{ color: '#34d399', fontWeight: 700 }}>Total Bayar</TableCell>
          <TableCell sx={{ color: '#fbbf24', fontWeight: 700 }}>Status Bayar</TableCell>
          <TableCell sx={{ color: '#60a5fa', fontWeight: 700 }}>Jatuh Tempo</TableCell>
          <TableCell sx={{ color: '#f472b6', fontWeight: 700 }}>Status Order</TableCell>
          <TableCell sx={{ color: '#a78bfa', fontWeight: 700 }}>Status</TableCell>
          <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Aksi</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data && data.length > 0 ? (
          data.map((row) => (
            <OrderRow
              key={row.id_order}
              row={row}
              expanded={expanded}
              detailsMap={detailsMap}
              detailsLoading={detailsLoading}
              onOpen={onOpen}
              onDelete={onDelete}
              onExpand={onExpand}
              productsList={productsList}
              customersMap={customersMap}
            />
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={11} align="center" sx={{ color: '#60a5fa', fontStyle: 'italic' }}>
              Belum ada data order.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
