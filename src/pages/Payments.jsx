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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/Check';
import { useSearchParams } from 'react-router-dom';

import { getPayments, getPaymentById, createPayment, updatePayment, deletePayment, verifyPayment } from '../api/payments';
import useNotificationStore from '../store/notificationStore';
import TableToolbar from '../components/TableToolbar';

const PaymentRow = React.memo(function PaymentRow({ row, expanded, detailsMap, detailsLoading, onOpen, onDelete, onExpand, onVerify }) {
  const id = row.id_payment || row.id;
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified': case 'approved': return 'success';
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
        <TableCell>{row.tanggal_bayar ? new Date(row.tanggal_bayar).toLocaleDateString() : '-'}</TableCell>
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
                  <Typography><strong>Reference:</strong> {detailsMap[id].reference || detailsMap[id].referensi || '-'}</Typography>
                  <Typography><strong>Bank:</strong> {detailsMap[id].bank || '-'}</Typography>
                  <Typography><strong>Account:</strong> {detailsMap[id].account_number || detailsMap[id].no_rekening || '-'}</Typography>
                  <Typography><strong>Notes:</strong> {detailsMap[id].notes || detailsMap[id].catatan || '-'}</Typography>
                  <Typography><strong>Verified At:</strong> {detailsMap[id].verified_at ? new Date(detailsMap[id].verified_at).toLocaleString() : '-'}</Typography>
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

  const handleVerify = (id) => {
    verifyPayment(id)
      .then(() => {
        showNotification('Payment verified successfully', 'success');
        reloadPayments();
      })
      .catch((err) => {
        showNotification('Failed to verify payment', 'error');
        console.error(err);
      });
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
    </Box>
  );
}

export default Payments;