import React from 'react';
import {
  Table,
  TableContainer,
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
import WhatsAppLogo from '../assets/WhatsApp.svg.webp';

function OrderRow({ row, expanded, detailsMap, detailsLoading, onOpen, onDelete, onExpand, productsList, customersMap }) {
  // normalize phone number for wa.me links
  const normalizePhone = (phone) => {
    if (!phone) return null;
    let normalized = String(phone || '').replace(/[^+\d]/g, '');
    if (!normalized) return null;
    if (normalized.startsWith('+')) normalized = normalized.slice(1);
    if (normalized.startsWith('0')) normalized = '62' + normalized.slice(1);
    // finally ensure only digits remain
    normalized = normalized.replace(/\D/g, '');
    return normalized || null;
  };
  return (
    <>
  <TableRow sx={{ '&:hover': { bgcolor: 'rgba(var(--accent-rgb),0.06)' } }}>
  <TableCell sx={{ color: 'var(--text)' }}>{row.no_transaksi || '-'}</TableCell>
  <TableCell sx={{ color: 'var(--text)' }}>{row.customer?.nama || customersMap[row.id_customer]?.nama || '-'}</TableCell>
  <TableCell sx={{ color: 'var(--text)' }}>
          {(() => {
            const phoneRaw = row.customer?.phone || row.customer?.no_hp || customersMap[row.id_customer]?.phone || customersMap[row.id_customer]?.no_hp || '';
            const phoneDisplay = phoneRaw || '-';
            if (!phoneRaw) return phoneDisplay;
            // build normalized number for href
            const normalized = normalizePhone(phoneRaw);
            const defaultText = encodeURIComponent('haii...');
            const waHref = normalized ? `https://wa.me/${normalized}?text=${defaultText}` : null;
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="a" href={waHref || '#'} target="_blank" rel="noopener noreferrer" sx={{ color: 'var(--text)', textDecoration: 'none' }} aria-label={`WhatsApp ${phoneDisplay}`}>
                  <Typography sx={{ color: 'var(--text)' }}>{phoneDisplay}</Typography>
                </Box>
                {/* Make the icon itself an anchor so it always opens wa.me/<number> rather than calling window.open */}
                <IconButton
                  size="small"
                  component={waHref ? 'a' : 'button'}
                  href={waHref || undefined}
                  target={waHref ? '_blank' : undefined}
                  rel={waHref ? 'noopener noreferrer' : undefined}
                  aria-label="open-whatsapp"
                  sx={{ color: '#25D366' }}
                >
                  <Box component="img" src={WhatsAppLogo} alt="WhatsApp" sx={{ width: 18, height: 18 }} />
                </IconButton>
              </Box>
            );
          })()}
        </TableCell>
  <TableCell sx={{ color: 'var(--muted)' }}>{row.tanggal_order ? new Date(row.tanggal_order).toLocaleString('id-ID') : '-'}</TableCell>
        <TableCell>
          <Chip label={row.status_urgensi || '-'} size="small" sx={{ bgcolor: row.status_urgensi === 'urgent' ? '#f87171' : 'var(--accent)', color: 'var(--button-text)', fontWeight: 700 }} />
        </TableCell>
  <TableCell sx={{ color: 'var(--accent)', fontWeight: 700 }}>{row.total_bayar ? `Rp${Number(row.total_bayar).toLocaleString('id-ID')}` : '-'}</TableCell>
        <TableCell>
          <Chip label={row.status_bayar || '-'} size="small" sx={{ bgcolor: row.status_bayar === 'lunas' ? '#34d399' : '#fbbf24', color: 'var(--button-text)', fontWeight: 700 }} />
        </TableCell>
  <TableCell sx={{ color: 'var(--accent-2)' }}>{row.tanggal_jatuh_tempo ? new Date(row.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : '-'}</TableCell>
        <TableCell>
          <Chip label={row.status_order || '-'} size="small" sx={{ bgcolor: row.status_order === 'proses' ? 'var(--accent)' : 'var(--muted)', color: 'var(--button-text)', fontWeight: 700 }} />
        </TableCell>
        <TableCell>
          <Chip label={row.status || '-'} size="small" sx={{ bgcolor: row.status === 'pending' ? '#fbbf24' : row.status === 'proses' ? '#60a5fa' : row.status === 'selesai' ? '#34d399' : '#f87171', color: 'var(--button-text)', fontWeight: 700 }} />
        </TableCell>
        <TableCell>
          {/* Paid status: prefer explicit status_bayar field, otherwise compare paid_amount vs total_bayar when present */}
          {(() => {
            const statusBayar = (row.status_bayar || '').toString().toLowerCase();
            const paidAmount = Number(row.paid_amount || row.total_dibayar || 0) || 0;
            const total = Number(row.total_bayar || row.total_tagihan || 0) || 0;
            const remaining = Math.max(0, total - paidAmount);
            const isPaid = statusBayar === 'lunas' || (total > 0 && remaining <= 0);
            const fmt = (v) => `Rp${Number(v || 0).toLocaleString('id-ID')}`;
            return (
              <Chip
                label={isPaid ? 'Lunas' : `Sisa ${fmt(remaining)}`}
                size="small"
                sx={{
                  bgcolor: isPaid ? 'var(--status-success)' : 'var(--status-warning)',
                  color: 'var(--button-text)',
                  fontWeight: 700,
                }}
              />
            );
          })()}
        </TableCell>
  <TableCell sx={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          <IconButton color="primary" onClick={() => onOpen(row)} size="small"><EditIcon fontSize="small"/></IconButton>
          <IconButton color="error" onClick={() => onDelete(row.id_order)} size="small"><DeleteIcon fontSize="small"/></IconButton>
          <IconButton color="info" onClick={() => onExpand(row.id_order)} size="small"><InfoIcon fontSize="small"/></IconButton>
        </TableCell>
      </TableRow>

      {(expanded === row.id_order || detailsLoading[row.id_order]) && (
        <TableRow>
          <TableCell colSpan={12} sx={{ p: 0, border: 0, bgcolor: 'transparent' }}>
            <Collapse in={expanded === row.id_order} timeout="auto" unmountOnExit>
              <Box sx={{ bgcolor: 'var(--main-card-bg)', borderRadius: 2, p: 2, mt: 1, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#60a5fa', fontWeight: 700, mb: 1 }}>Order Details</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'var(--accent-2)', fontWeight: 700 }}>Produk</TableCell>
                      <TableCell sx={{ color: 'var(--accent)', fontWeight: 700 }}>Qty</TableCell>
                      <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Harga Satuan</TableCell>
                      <TableCell sx={{ color: 'var(--accent-2)', fontWeight: 700 }}>Subtotal</TableCell>
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
                          <TableCell sx={{ color: 'var(--text)' }}>{prodName}</TableCell>
                          <TableCell sx={{ color: 'var(--accent)', fontWeight: 700 }}>{d.quantity || '-'}</TableCell>
                          <TableCell sx={{ color: 'var(--muted)' }}>{d.harga_satuan ? `Rp${Number(d.harga_satuan).toLocaleString('id-ID')}` : '-'}</TableCell>
                          <TableCell sx={{ color: 'var(--accent-2)' }}>{d.subtotal_item ? `Rp${Number(d.subtotal_item).toLocaleString('id-ID')}` : '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                    {detailsLoading[row.id_order] && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: 'var(--accent-2)', fontStyle: 'italic' }}>
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
      )}
    </>
  );
}

export default function OrdersTable(props) {
  const { data, expanded, detailsMap, detailsLoading, onOpen, onDelete, onExpand, productsList, customersMap } = props;

  // shared col widths
  const cols = [
    // further widened per user feedback: No Transaksi, Phone, Tanggal Order, Total Bayar, Jatuh Tempo, Dibayar
    '320px','280px','280px','280px','180px','280px','280px','280px','160px','160px','180px','60px'
  ];

  return (
    <Box className="orders-table" sx={{ width: '100%', boxSizing: 'border-box', height: '100%' }}>
      {/* allow both horizontal and vertical scrolling; ensure scrollbar for header+body */}
  <Box
    className="modal-scroll"
    sx={{
      width: '100%',
      height: '100%',
      overflowX: 'auto',
      overflowY: 'auto',
      boxSizing: 'border-box',
      scrollbarWidth: 'thin',
      scrollbarColor: 'var(--scroll-thumb-color) var(--scroll-track-color)',
      '&::-webkit-scrollbar': { width: 10, height: 10 },
      '&::-webkit-scrollbar-track': { background: 'var(--scroll-track, transparent)' },
      '&::-webkit-scrollbar-thumb': { background: 'var(--scroll-thumb)', borderRadius: 8, boxShadow: '0 0 8px rgba(var(--text-rgb),0.06)' },
      '&::-webkit-scrollbar-thumb:hover': { background: 'var(--scroll-thumb)' },
    }}
  >
  <Table className="orders-table" sx={{ tableLayout: 'fixed', minWidth: { xs: 1200, md: 2600 }, width: 'max-content', '& .MuiTableCell-root': { boxSizing: 'border-box', padding: '0.75rem 0.75rem' }, '& .MuiTableCell-root:last-child': { paddingRight: 0 } }}>
          <colgroup>
            {cols.map((w, i) => <col key={i} style={{ width: w }} />)}
          </colgroup>
          <TableHead sx={{ position: 'sticky', top: 0, zIndex: 1200, background: 'var(--main-card-bg)' }}>
            <TableRow sx={{ bgcolor: 'transparent' }}>
              <TableCell sx={{ color: 'var(--accent-2)', fontWeight: 700 }}>No Transaksi</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Phone</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Tanggal Order</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Status Urgensi</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Total Bayar</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Status Bayar</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Jatuh Tempo</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Status Order</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Dibayar</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Aksi</TableCell>
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
                <TableCell colSpan={12} align="center" sx={{ color: '#60a5fa', fontStyle: 'italic' }}>
                  Belum ada data order.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
