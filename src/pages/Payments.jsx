import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Chip,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/Check';
import { useSearchParams } from 'react-router-dom';

import { getPayments, getPaymentById, createPayment, updatePayment, deletePayment, verifyPayment, getPaymentsByTransaksi } from '../api/payments';
import { getCustomersByPhone } from '../api/customers';
import { getInvoiceByTransaksi } from '../api/invoices';
import { getOrderByTransaksi } from '../api/orders';
import useNotificationStore from '../store/notificationStore';
import TableToolbar from '../components/TableToolbar';

const PaymentRow = React.memo(function PaymentRow({ row, expanded, detailsMap, detailsLoading, onOpen, onDelete, onExpand, onVerify }) {
  const id = row.id_payment || row.id;
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified': case 'approved': case 'confirmed': return 'success';
      case 'menunggu_verifikasi': return 'warning';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return 'Rp 0';
    return `Rp ${Number(amount).toLocaleString('id-ID')}`;
  };

  return (
    <>
      <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
        <TableCell>{id}</TableCell>
        <TableCell>{row.no_transaksi || '-'}</TableCell>
        <TableCell>{formatAmount(row.nominal || row.amount)}</TableCell>
        <TableCell>{row.payment_method || row.metode_bayar || '-'}</TableCell>
        <TableCell>
          <Chip 
            label={row.status || 'pending'} 
            color={getStatusColor(row.status)}
            size="small"
          />
        </TableCell>
  <TableCell>{row.tanggal ? new Date(row.tanggal).toLocaleDateString() : '-'}</TableCell>
        <TableCell>
          <IconButton color="primary" onClick={() => onOpen(row)} size="small"><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => onDelete(id)} size="small"><DeleteIcon /></IconButton>
          <IconButton color="info" onClick={() => onExpand(id)} size="small"><InfoIcon /></IconButton>
          {row.status !== 'verified' && (
            <IconButton color="success" onClick={() => onVerify(id)} size="small"><CheckIcon /></IconButton>
          )}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
          <Collapse in={expanded === id} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom>Payment Details</Typography>
              {detailsLoading[id] ? (
                <Typography>Loading details...</Typography>
              ) : detailsMap[id] ? (
                <Box>
                  <Typography><strong>No Transaksi:</strong> {detailsMap[id].no_transaksi || detailsMap[id].reference || '-'}</Typography>
                  <Typography><strong>No HP:</strong> {detailsMap[id].no_hp || '-'}</Typography>
                  <Typography><strong>Tipe:</strong> {detailsMap[id].tipe || '-'}</Typography>
                  <Typography><strong>Bukti:</strong> {detailsMap[id].bukti ? <a href={detailsMap[id].bukti} target="_blank" rel="noreferrer">Open</a> : '-'}</Typography>
                  <Typography><strong>Notes:</strong> {detailsMap[id].notes || detailsMap[id].catatan || '-'}</Typography>
                  <Typography><strong>Tanggal:</strong> {detailsMap[id].tanggal ? new Date(detailsMap[id].tanggal).toLocaleString() : '-'}</Typography>
                </Box>
              ) : (
                <Typography>No additional details available</Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
});

function Payments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});
  const [detailsLoading, setDetailsLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [verifyDialog, setVerifyDialog] = useState({ open: false, id: null, form: {} });
  const [verifySuggested, setVerifySuggested] = useState({ remaining: null, suggestedStatus: '', total: null, paid: null, customerName: '', customerPhone: '', type: '' });
  const [verifyImageError, setVerifyImageError] = useState(false);
  const [verifyImagePreviewUrl, setVerifyImagePreviewUrl] = useState('');
  const [verifyImageOpen, setVerifyImageOpen] = useState(false);
  const { showNotification } = useNotificationStore();

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '' || value == null) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    setSearchParams(params)
  }

  const reloadPayments = useCallback(() => {
    setLoading(true);
    return getPayments()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setData(Array.isArray(items) ? items : []);
        setError(null);
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setData([]);
          setError('Data payment tidak ditemukan.');
        } else {
          setError('Gagal memuat data payments');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    reloadPayments();
  }, [reloadPayments]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      showNotification('🔄 Refreshing payments...', 'info')
      reloadPayments().then(() => {
        showNotification(`✅ ${data.length} payments loaded`, 'success')
      }).catch(() => {
        showNotification('❌ Failed to refresh payments', 'error')
      })
    }
    
    window.addEventListener('app:refresh:payments', handleRefresh)
    return () => window.removeEventListener('app:refresh:payments', handleRefresh)
  }, [reloadPayments, data.length, showNotification])

  const searchQuery = searchParams.get('q') || ''
  const statusFilter = searchParams.get('status') || ''
  const methodFilter = searchParams.get('method') || ''
  
  const filteredData = data.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const hay = `${row.no_transaksi || ''} ${row.payment_method || row.metode_bayar || ''} ${row.reference || row.referensi || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (statusFilter) {
      if ((row.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    if (methodFilter) {
      if ((row.payment_method || row.metode_bayar || '').toLowerCase() !== methodFilter.toLowerCase()) return false;
    }
    return true;
  });

  const handleOpen = useCallback((item = {}) => {
    setForm(item);
    setErrors({});
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);
  const handleChange = useCallback((e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value })), []);

  const handleSave = () => {
    const newErrors = {};
    if (!form.no_transaksi?.trim()) newErrors.no_transaksi = 'Transaction number is required';
    if (!form.nominal || Number(form.nominal) <= 0) newErrors.nominal = 'Amount must be greater than 0';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const promise = form.id_payment || form.id ? 
      updatePayment(form.id_payment || form.id, form) : 
      createPayment(form);
      
    promise
      .then(() => {
        showNotification(`Payment ${form.id_payment || form.id ? 'updated' : 'created'} successfully`, 'success');
        handleClose();
        reloadPayments();
      })
      .catch((err) => {
        showNotification(`Failed to ${form.id_payment || form.id ? 'update' : 'create'} payment`, 'error');
        console.error(err);
      });
  };

  const handleDelete = (id) => setDeleteConfirm({ open: true, id });

  const confirmDelete = () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    if (!id) return;
    
    deletePayment(id)
      .then(() => {
        showNotification('Payment deleted successfully', 'success');
        reloadPayments();
      })
      .catch((err) => {
        showNotification('Failed to delete payment', 'error');
        console.error(err);
      });
  };

  // Open verify modal (prefill nominal and load details/invoice to compute suggested status)
  const handleVerify = (id) => {
    // open dialog and load payment details if available
    setVerifyDialog({ open: true, id, form: { nominal: '', no_transaksi: '' } });
    // try to load details to prefill nominal and no_transaksi
    getPaymentById(id)
      .then((res) => {
        const p = res?.data || res || {};
        setVerifyDialog((s) => ({ ...s, form: { nominal: p.nominal || p.amount || '', no_transaksi: p.no_transaksi || p.transaksi || p.reference || '', bukti: p.bukti || p.bukti_url || p.proof || '' } }));
        setDetailsMap((prev) => ({ ...prev, [id]: p }));
        // if we have a transaction number, try to fetch invoice to compute remaining
        const tx = p.no_transaksi || p.transaksi || p.reference || '';
        if (tx) {
          // fetch invoice and payments to compute totals and then fetch customer by phone if possible
          Promise.all([getOrderByTransaksi(tx).catch(() => null), getPaymentsByTransaksi(tx).catch(() => null)])
            .then(async ([orderRes, payRes]) => {
              const ord = orderRes?.data || orderRes || {};
              const paymentsArr = payRes?.data?.data || payRes?.data || payRes || [];
              // prefer order.total_bayar or order.total_harga as total order amount
              // Prefer order fields: if order provides total_bayar and dp_bayar, use sisa = total_bayar - dp_bayar
              const orderTotalBayar = Number(ord.total_bayar || ord.total || ord.total_harga || 0) || 0;
              const orderDpBayar = Number(ord.dp_bayar || ord.dp || 0) || 0;
              const paid = Array.isArray(paymentsArr) ? paymentsArr.reduce((acc, it) => acc + (Number(it.nominal || it.amount || 0) || 0), 0) : 0;
              let remaining;
              if (orderTotalBayar && (orderDpBayar || orderDpBayar === 0)) {
                // use requested formula: sisa = total_bayar - dp_bayar
                remaining = orderTotalBayar - orderDpBayar;
              } else {
                // fallback: remaining = total - paid
                const total = orderTotalBayar;
                remaining = Math.max(0, total - paid);
              }
              remaining = Math.max(0, remaining);
              const suggestedStatus = nominalCompareSuggestion(Number(p.nominal || p.amount || 0), remaining);
              // try to extract customer phone and name from order
              const customerPhone = p.no_hp || ord.no_hp || ord.no_hp_customer || '';
              let customerName = ord.nama || ord.nama_customer || ord.customer_name || '';
              if (!customerName && customerPhone) {
                try {
                  const cRes = await getCustomersByPhone(customerPhone);
                  const c = cRes?.data?.data || cRes?.data || cRes || {};
                  if (Array.isArray(c) && c.length > 0) customerName = c[0].nama || c[0].name || '';
                  else if (c && c.nama) customerName = c.nama || c.name || '';
                } catch (e) {
                  // ignore
                }
              }
              const type = (paid === 0) ? 'belum_bayar' : (paid < total ? 'dp' : 'lunas');
              setVerifySuggested({ remaining, suggestedStatus, total, paid, customerName, customerPhone, type });
              setVerifyImageError(false);
            })
            .catch(() => setVerifySuggested({ remaining: null, suggestedStatus: '', total: null, paid: null, customerName: '', customerPhone: '', type: '' }));
        }
      })
      .catch((err) => {
        // ignore, leave defaults
        console.error('Failed to load payment details for verify modal', err);
      });
  };

  const nominalCompareSuggestion = (nominal, remaining) => {
    if (remaining == null) return '';
    if (nominal >= remaining) return 'approved';
    if (nominal > 0 && nominal < remaining) return 'pending';
    return '';
  };

  const handleVerifyClose = () => setVerifyDialog({ open: false, id: null, form: {} });

  // confirm verification: try approve endpoint with nominal then fallback to verify
  const confirmVerify = async () => {
    const id = verifyDialog.id;
    const nominal = Number(verifyDialog.form.nominal || 0);
    if (!id) return;
    if (!nominal || nominal <= 0) {
      showNotification('Nominal harus lebih besar dari 0', 'error');
      return;
    }

    // prefer approve endpoint which accepts nominal
    try {
      // try approvePaymentNominal if available in API
      // import is in api/payments, call via approvePaymentNominal if exists on module
      const paymentsApi = await import('../api/payments');
      if (paymentsApi && paymentsApi.approvePaymentNominal) {
        await paymentsApi.approvePaymentNominal(id, nominal);
      } else if (paymentsApi && paymentsApi.approvePayment) {
        await paymentsApi.approvePayment(id, { nominal });
      } else {
        // fallback to verify endpoint
        await paymentsApi.verifyPayment(id, { nominal });
      }

      showNotification('Payment verified/approved successfully', 'success');
      handleVerifyClose();
      reloadPayments();
    } catch (err) {
      console.error('Failed to approve/verify payment', err);
      showNotification('Failed to verify payment', 'error');
    }
  };

  const handleExpandWithDetails = useCallback((id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!detailsMap[id] && !detailsLoading[id]) {
      setDetailsLoading((prev) => ({ ...prev, [id]: true }));
      getPaymentById(id)
        .then((res) => {
          setDetailsMap((prev) => ({ ...prev, [id]: res?.data || res }));
        })
        .catch((err) => {
          console.error(`Failed to load details for payment ${id}`, err);
          setDetailsMap((prev) => ({ ...prev, [id]: null }));
        })
        .finally(() => {
          setDetailsLoading((prev) => ({ ...prev, [id]: false }));
        });
    }
  }, [expanded, detailsMap, detailsLoading]);

  // Filter options
  const statusFilterOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ]

  const methodFilterOptions = [
    ...new Set(data.map(d => d.payment_method || d.metode_bayar))
  ].filter(Boolean).map(c => ({ value: c, label: c }))

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          <TableToolbar
            value={searchParams.get('q') || ''}
            onChange={(value) => updateParam('q', value)}
            placeholder="Search payments (transaction, amount, method)"
            hideFilters
            statusFilters={[
              {
                label: 'Status',
                value: searchParams.get('status') || '',
                onChange: (value) => updateParam('status', value),
                options: statusFilterOptions
              },
              {
                label: 'Method',
                value: searchParams.get('method') || '',
                onChange: (value) => updateParam('method', value),
                options: methodFilterOptions
              }
            ]}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            startIcon={<RefreshIcon />} 
            variant="outlined" 
            size="small" 
            onClick={() => window.dispatchEvent(new CustomEvent('app:refresh:payments'))}
          >
            Refresh
          </Button>
          <Button 
            startIcon={<AddIcon />} 
            variant="contained" 
            size="small" 
            onClick={() => handleOpen()}
          >
            Add Payment
          </Button>
        </Box>
      </Box>

      {/* Payments Table */}
      <Box 
        sx={{ 
          maxHeight: 'clamp(40vh, calc(100vh - var(--header-height) - 160px), 75vh)',
          overflow: 'auto',
          overflowX: 'auto'
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Transaction No</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography>
                    {data.length === 0 ? 'No payments found' : 'No payments match current filters'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <PaymentRow
                  key={row.id_payment || row.id}
                  row={row}
                  expanded={expanded}
                  detailsLoading={detailsLoading}
                  detailsMap={detailsMap}
                  onOpen={handleOpen}
                  onDelete={handleDelete}
                  onExpand={handleExpandWithDetails}
                  onVerify={handleVerify}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Add/Edit Payment Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id_payment || form.id ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Transaction Number"
              name="no_transaksi"
              value={form.no_transaksi || ''}
              onChange={handleChange}
              error={!!errors.no_transaksi}
              helperText={errors.no_transaksi}
              fullWidth
            />
            <TextField
              label="Amount"
              name="nominal"
              type="number"
              value={form.nominal || form.amount || ''}
              onChange={handleChange}
              error={!!errors.nominal}
              helperText={errors.nominal}
              fullWidth
            />
            <TextField
              label="Payment Method"
              name="payment_method"
              select
              value={form.payment_method || form.metode_bayar || ''}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="">Select Method</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="transfer">Bank Transfer</MenuItem>
              <MenuItem value="credit_card">Credit Card</MenuItem>
              <MenuItem value="e_wallet">E-Wallet</MenuItem>
            </TextField>
            <TextField
              label="Reference"
              name="reference"
              value={form.reference || form.referensi || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Notes"
              name="notes"
              value={form.notes || form.catatan || ''}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Large image preview dialog */}
      <Dialog open={verifyImageOpen} onClose={() => setVerifyImageOpen(false)} maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Bukti Preview
          <IconButton size="small" onClick={() => setVerifyImageOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {verifyImagePreviewUrl ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img src={verifyImagePreviewUrl} alt="bukti-large" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
            </Box>
          ) : (
            <Typography>No image available</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this payment?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Verify / Approve Payment Dialog */}
      <Dialog open={verifyDialog.open} onClose={handleVerifyClose} maxWidth="sm" fullWidth>
        <DialogTitle>Verify / Approve Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Transaction No"
              name="no_transaksi"
              value={verifyDialog.form.no_transaksi || ''}
              onChange={(e) => setVerifyDialog((s) => ({ ...s, form: { ...s.form, no_transaksi: e.target.value } }))}
              fullWidth
            />
            <TextField
              label="Nominal to approve"
              name="nominal"
              type="number"
              value={verifyDialog.form.nominal || ''}
              onChange={(e) => setVerifyDialog((s) => ({ ...s, form: { ...s.form, nominal: e.target.value } }))}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="Bukti (link)"
                name="bukti"
                value={verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || ''}
                onChange={(e) => { setVerifyDialog((s) => ({ ...s, form: { ...s.form, bukti: e.target.value } })); setVerifyImageError(false); }}
                fullWidth
              />
              <Button
                size="small"
                disabled={!((verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || '').trim())}
                onClick={() => {
                  const url = (verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || '').trim();
                  if (!url) return;
                  setVerifyImagePreviewUrl(url);
                  setVerifyImageOpen(true);
                }}
              >Preview</Button>
              <Button
                size="small"
                disabled={!((verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || '').trim())}
                onClick={() => {
                  const url = (verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || '').trim();
                  if (!url) return;
                  window.open(url, '_blank');
                }}
              >Open</Button>
            </Box>
            {verifySuggested.total != null && (
              <Box sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                <Typography variant="body2"><strong>Nama Customer:</strong> {verifySuggested.customerName || '-'}</Typography>
                <Typography variant="body2"><strong>No HP:</strong> {verifySuggested.customerPhone || detailsMap[verifyDialog.id]?.no_hp || '-'}</Typography>
                <Typography variant="body2"><strong>Total Pesanan:</strong> Rp {Number(verifySuggested.total || 0).toLocaleString('id-ID')}</Typography>
                <Typography variant="body2"><strong>Total Dibayar:</strong> Rp {Number(verifySuggested.paid || 0).toLocaleString('id-ID')}</Typography>
                <Typography variant="body2"><strong>Sisa yang harus dibayar:</strong> Rp {Number(verifySuggested.remaining || 0).toLocaleString('id-ID')}</Typography>
                <Typography variant="body2"><strong>Type:</strong> {verifySuggested.type || detailsMap[verifyDialog.id]?.tipe || '-'}</Typography>
                {verifySuggested.suggestedStatus && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>Suggested status: <strong>{verifySuggested.suggestedStatus}</strong></Typography>
                )}
              </Box>
            )}
            {/* Preview link for bukti/proof if available in detailsMap for this id */}
            {verifyDialog.id && detailsMap[verifyDialog.id] && (() => {
              const d = detailsMap[verifyDialog.id];
              const url = d.bukti || d.bukti_url || d.proof || d.file || d.image || d.attachment || d.bukti_transfer || d.proof_url;
              if (!url) return null;
              return (
                <Box>
                  <Typography variant="subtitle2">Preview bukti</Typography>
                  {/* attempt inline preview, fallback to open in new tab if image fails (e.g., gdrive preview) */}
                  {!verifyImageError ? (
                    <Box sx={{ mt: 1, mb: 1 }}>
                      <img
                        src={url}
                        alt="bukti"
                        style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 8, cursor: 'pointer' }}
                        onError={() => setVerifyImageError(true)}
                        onClick={() => { setVerifyImagePreviewUrl(url); setVerifyImageOpen(true); }}
                      />
                    </Box>
                  ) : null}
                  <Button size="small" onClick={() => window.open(url, '_blank')}>Open Bukti</Button>
                </Box>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleVerifyClose}>Cancel</Button>
          <Button onClick={confirmVerify} variant="contained" color="success">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Payments;