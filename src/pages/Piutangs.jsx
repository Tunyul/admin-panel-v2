import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Chip,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  Link
  ,Table as MuiTable, TableHead, TableRow as MuiTableRow, TableCell as MuiTableCell, TableBody
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
// InfoIcon previously used for inline details; removed because details are loaded via dialog
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSearchParams } from 'react-router-dom';

import { getPiutangs, createPiutang, updatePiutang, deletePiutang } from '../api/piutangs';
import useNotificationStore from '../store/notificationStore';
import TableToolbar from '../components/TableToolbar';
import ExampleTableComponent from '../components/ExampleTableComponent'
import TableSettingsButton from '../components/TableSettingsButton'
import { useTableColumns, useTableFilters, useTableSorting } from '../hooks/useTableSettings'
import { currency } from '../utils/format'

function Piutangs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  // details/loading/expanded state removed - details are loaded on-demand by dialog/modal
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const { showNotification } = useNotificationStore();
  const tableId = 'piutangs'
  const { visibleColumns: _visibleColumns } = useTableColumns(tableId)
  const { filters: _filters, setFilters: _setFilters } = useTableFilters(tableId, { status: '', customer: '' })
  useTableSorting(tableId)

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '' || value == null) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    setSearchParams(params)
  }

  const reloadPiutangs = useCallback(() => {
    setLoading(true);
    return getPiutangs()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        const arr = Array.isArray(items) ? items : [];
        // normalize to generic table row shape
        const normalized = arr.map((it, i) => ({
          // primary id expected by table
          id: it.id_piutang || it.id || i + 1,
          id_piutang: it.id_piutang,
          // order relation - prefer nested Order object when available
          id_order: it.Order?.id_order || it.id_order || it.orderId || it.order_id || null,
          // Also provide `orderId` for compatibility with other table renderers
          orderId: it.Order?.id_order || it.id_order || it.orderId || it.order_id || null,
          // transaction / invoice numbers - prefer Order.no_transaksi when present
          no_transaksi: it.no_transaksi || it.Order?.no_transaksi || it.no_tx || it.transaksi || it.no || '',
          // expose a convenient orderNo and orderTotal
          orderNo: it.Order?.no_transaksi || it.no_transaksi || it.Order?.no_transaksi || '',
          orderTotal: it.Order?.total_bayar != null ? Number(it.Order.total_bayar) : (it.Order?.total || null),
          // customer info (prefer embedded Customer object)
          customerName: it.Customer?.nama || it.pelanggan_nama || it.customer_name || '',
          customerId: it.Customer?.id_customer || it.id_customer || null,
          customerPhone: it.Customer?.no_hp || it.no_hp || it.customer_phone || it.pelanggan_nohp || '',
            // monetary and date fields (normalize numeric strings to numbers)
            amount: it.jumlah_piutang != null ? Number(it.jumlah_piutang) : (it.amount != null ? Number(it.amount) : 0),
            jumlah_piutang: it.jumlah_piutang != null ? Number(it.jumlah_piutang) : null,
            paid: it.paid != null ? Number(it.paid) : (it.sudah_dibayar != null ? Number(it.sudah_dibayar) : (it.paid_amount != null ? Number(it.paid_amount) : 0)),
            dueDate: it.tanggal_piutang || it.tanggal || it.date || null,
            tanggal_piutang: it.tanggal_piutang || null,
            status: it.status || 'belum_lunas',
            keterangan: it.keterangan || it.description || it.notes || null,
            // preserve payments history fields returned by API (if present)
            verified_payments: it.verified_payments || it.verifiedPayments || [],
            verified_payments_count: it.verified_payments_count != null ? Number(it.verified_payments_count) : (Array.isArray(it.verified_payments) ? it.verified_payments.length : 0),
            verified_paid: it.verified_paid != null ? Number(it.verified_paid) : (it.verified_paid_amount != null ? Number(it.verified_paid_amount) : null),
            dp_bayar: it.dp_bayar != null ? Number(it.dp_bayar) : (it.Order?.dp_bayar != null ? Number(it.Order.dp_bayar) : null),
            // Expose related Order and Customer fields for convenience in the UI
            Order: it.Order || null,
            Customer: it.Customer || null
        }))
        // Compute total piutangs per orderId so we can show order-level total
        const totalsByOrder = normalized.reduce((acc, r) => {
          const oid = r.orderId || r.id_order || null
          if (!oid) return acc
          acc[oid] = (acc[oid] || 0) + (Number(r.amount) || 0)
          return acc
        }, {})

        const enriched = normalized.map((r) => {
          // Prefer authoritative order-level total when available (from embedded Order object)
          const orderTotalValue = (r.orderTotal != null && !Number.isNaN(Number(r.orderTotal))) ? Number(r.orderTotal) : (r.orderId ? (totalsByOrder[r.orderId] || 0) : 0)
          // If Order provides dp_bayar, prefer that as the shown/authoritative 'paid' value
          const orderDp = r.Order && r.Order.dp_bayar != null ? Number(r.Order.dp_bayar) : null
          const paidFromRow = Number(r.paid) || 0
          const paidUsed = orderDp != null ? orderDp : paidFromRow
          const sisaVal = orderTotalValue > 0 ? orderTotalValue - paidUsed : (Number(r.amount) || 0) - paidUsed
          return {
            ...r,
            paid: paidUsed,
            sisa: sisaVal,
            totalPiutangOrder: orderTotalValue
          }
        })

        setData(enriched);
        setError(null);
        return arr;
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setData([]);
          setError('Data piutang tidak ditemukan.');
        } else {
          setError('Gagal memuat data piutangs');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => { reloadPiutangs() }, [reloadPiutangs])

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      showNotification('🔄 Refreshing piutangs...', 'info')
      reloadPiutangs()
        .then((items) => showNotification(`✅ ${Array.isArray(items) ? items.length : 0} piutangs loaded`, 'success'))
        .catch(() => showNotification('❌ Failed to refresh piutangs', 'error'))
    }

    window.addEventListener('app:refresh:piutangs', handleRefresh)
    return () => window.removeEventListener('app:refresh:piutangs', handleRefresh)
  }, [reloadPiutangs, showNotification])

  const searchQuery = searchParams.get('q') || ''
  const statusFilter = searchParams.get('status') || ''
  const customerFilter = searchParams.get('customer') || ''
  
  const filteredData = data.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const phone = (row.no_hp || row.Customer?.no_hp || row.customer_phone || row.pelanggan_nohp || '');
      const trx = (row.no_transaksi || row.no_tx || row.transaksi || '');
      const paid = (row.paid || row.sudah_dibayar || row.paid_amount || '');
      const hay = `${row.id_piutang || row.id || ''} ${trx} ${row.pelanggan_nama || row.customer_name || ''} ${phone} ${paid} ${row.keterangan || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (statusFilter) {
      if ((row.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    if (customerFilter) {
      const phone = (row.no_hp || row.Customer?.no_hp || row.customer_phone || row.pelanggan_nohp || '');
      const name = (row.pelanggan_nama || row.customer_name || '');
      const trx = (row.no_transaksi || row.no_tx || row.transaksi || '');
      const paid = String(row.paid || row.sudah_dibayar || row.paid_amount || '');
      if (name.toLowerCase() !== customerFilter.toLowerCase() && phone.toLowerCase() !== customerFilter.toLowerCase() && trx.toLowerCase() !== customerFilter.toLowerCase() && paid.toLowerCase() !== customerFilter.toLowerCase()) return false;
    }
    return true;
  });

  const handleOpen = useCallback((item = {}) => {
    // legacy: keep modal open handler
    setForm(item);
    setErrors({});
    setOpen(true);
  }, []);

  const handleToggleExpand = useCallback((item = {}) => {
    const id = item.id || item.id_piutang
    setExpandedId((prev) => (prev === id ? null : id))
    // also set current form so details can be shown in expanded area
    setForm(item)
  }, [])

  const handleClose = useCallback(() => setOpen(false), []);
  const handleChange = useCallback((e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value })), []);

  const handleSave = () => {
    const newErrors = {};
    if (!form.id_customer?.toString().trim()) newErrors.id_customer = 'Customer ID is required';
    if (!form.jumlah_piutang || Number(form.jumlah_piutang) <= 0) newErrors.jumlah_piutang = 'Amount must be greater than 0';
    if (!form.tanggal_piutang) newErrors.tanggal_piutang = 'Date is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      id_customer: form.id_customer || null,
      jumlah_piutang: form.jumlah_piutang ? Number(form.jumlah_piutang) : 0,
      tanggal_piutang: form.tanggal_piutang || null,
      status: form.status || 'outstanding',
      keterangan: form.keterangan || null,
    };

    const promise = form.id_piutang || form.id ? 
      updatePiutang(form.id_piutang || form.id, payload) : 
      createPiutang(payload);
      
    promise
      .then(() => {
        showNotification(`Piutang ${form.id_piutang || form.id ? 'updated' : 'created'} successfully`, 'success');
        handleClose();
        reloadPiutangs();
      })
      .catch((err) => {
        showNotification(`Failed to ${form.id_piutang || form.id ? 'update' : 'create'} piutang`, 'error');
        console.error(err);
      });
  };

  const handleDelete = (id) => setDeleteConfirm({ open: true, id });

  const confirmDelete = () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    if (!id) return;
    
    deletePiutang(id)
      .then(() => {
        showNotification('Piutang deleted successfully', 'success');
        reloadPiutangs();
      })
      .catch((err) => {
        showNotification('Failed to delete piutang', 'error');
        console.error(err);
      });
  };

  // Inline expand handler removed (details view uses dialog/modal to avoid per-row variable height in heavy lists)

  // Filter options
  // statusFilterOptions and customerFilterOptions were unused; kept logic inline where needed

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          <TableToolbar
            value={searchQuery}
            onChange={(value) => updateParam('q', value)}
            placeholder="Search piutangs (ID, Customer, Description)"
            hideFilters
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TableSettingsButton tableId={tableId} variant="button" showLabel={true} />
          <Button startIcon={<RefreshIcon />} variant="outlined" size="small" onClick={() => window.dispatchEvent(new CustomEvent('app:refresh:piutangs'))}>Refresh</Button>
          <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => handleOpen()}>Add Piutang</Button>
        </Box>
      </Box>
      {/* Use shared ExampleTableComponent for consistent layout and settings */}
      <ExampleTableComponent
        tableId={tableId}
        data={filteredData}
        loading={_loading}
        onEdit={(row) => handleOpen(row)}
        onDelete={(row) => handleDelete(row.id || row.id_piutang)}
        onRowClick={(row) => handleToggleExpand(row)}
        expandedRowId={expandedId}
        renderExpandedRow={(row) => (
          <Box sx={{ p: 1 }}>
            {row && Array.isArray(row.verified_payments) && row.verified_payments.length > 0 ? (
              <MuiTable size="small">
                <TableHead>
                  <MuiTableRow>
                    <MuiTableCell>No Transaksi</MuiTableCell>
                    <MuiTableCell align="right">Uang</MuiTableCell>
                    <MuiTableCell>Bukti</MuiTableCell>
                    <MuiTableCell>Waktu</MuiTableCell>
                  </MuiTableRow>
                </TableHead>
                <TableBody>
                  {row.verified_payments.map((p) => (
                    <MuiTableRow key={p.id_payment || p.id || `${p.no_transaksi}-${p.tanggal}`}>
                      <MuiTableCell>{p.no_transaksi || p.reference || '-'}</MuiTableCell>
                      <MuiTableCell align="right">{p.nominal ? currency(Number(p.nominal)) : (p.nominal_raw ? currency(Number(p.nominal_raw)) : '-')}</MuiTableCell>
                      <MuiTableCell>{p.bukti ? <Link href={p.bukti} target="_blank" rel="noreferrer">Lihat</Link> : '-'}</MuiTableCell>
                      <MuiTableCell>{p.tanggal ? new Date(p.tanggal).toLocaleString() : (p.tanggal_pay || '-')}</MuiTableCell>
                    </MuiTableRow>
                  ))}
                </TableBody>
              </MuiTable>
            ) : (
              <Typography>Belum ada pembayaran terverifikasi untuk piutang ini.</Typography>
            )}
          </Box>
        )}
      />

  {/* Add/Edit Piutang Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id_piutang || form.id ? 'Edit Piutang' : 'Add Piutang'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Customer ID"
              name="id_customer"
              value={form.id_customer || ''}
              onChange={handleChange}
              error={!!errors.id_customer}
              helperText={errors.id_customer}
              fullWidth
            />
            <TextField
              label="Amount"
              name="jumlah_piutang"
              type="number"
              value={form.jumlah_piutang || ''}
              onChange={handleChange}
              error={!!errors.jumlah_piutang}
              helperText={errors.jumlah_piutang}
              fullWidth
            />
            <TextField
              label="Date"
              name="tanggal_piutang"
              type="date"
              value={form.tanggal_piutang || ''}
              onChange={handleChange}
              error={!!errors.tanggal_piutang}
              helperText={errors.tanggal_piutang}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Status"
              name="status"
              select
              value={form.status || 'outstanding'}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="outstanding">Outstanding</MenuItem>
              <MenuItem value="lunas">Lunas</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </TextField>
            <TextField
              label="Description"
              name="keterangan"
              value={form.keterangan || ''}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
          {/* Payments history (read-only) */}
          {form && Array.isArray(form.verified_payments) && form.verified_payments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Payments History ({form.verified_payments_count || form.verified_payments.length})</Typography>
              <List dense>
                {form.verified_payments.map((p) => (
                  <React.Fragment key={p.id_payment || p.id || `${p.no_transaksi}-${p.tanggal}`}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <>
                            <strong>{p.tipe ? `${p.tipe} · ` : ''}</strong>
                            {p.nominal ? currency(Number(p.nominal)) : (p.nominal_raw ? currency(Number(p.nominal_raw)) : '-')}
                            {' — '}
                            <em>{p.tanggal ? new Date(p.tanggal).toLocaleString() : (p.tanggal_pay || '-')}</em>
                          </>
                        }
                        secondary={
                          <>
                            <div>No Transaksi: {p.no_transaksi || p.reference || '-'}</div>
                            <div>No HP: {p.no_hp || '-'}</div>
                            {p.bukti && (
                              <div>
                                Bukti: <Link href={p.bukti} target="_blank" rel="noreferrer">Lihat</Link>
                              </div>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">Total Verified Paid: {form.verified_paid != null ? currency(Number(form.verified_paid)) : (form.paid != null ? currency(Number(form.paid)) : '-')}</Typography>
                <Typography variant="body2">DP (Order): {form.dp_bayar != null ? currency(Number(form.dp_bayar)) : (form.Order?.dp_bayar != null ? currency(Number(form.Order.dp_bayar)) : '-')}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this piutang?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Piutangs;