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
import { useSearchParams } from 'react-router-dom';

import { getPiutangs, getPiutangById, createPiutang, updatePiutang, deletePiutang } from '../api/piutangs';
import useNotificationStore from '../store/notificationStore';
import TableToolbar from '../components/TableToolbar';

const PiutangRow = React.memo(function PiutangRow({ row, expanded, detailsMap, detailsLoading, onOpen, onDelete, onExpand }) {
  const id = row.id_piutang || row.id;
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'lunas': return 'success';
      case 'overdue': return 'error';
      case 'outstanding': return 'warning';
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
        <TableCell>{row.pelanggan_nama || row.customer_name || '-'}</TableCell>
        <TableCell>{formatAmount(row.jumlah_piutang || row.amount)}</TableCell>
        <TableCell>{row.tanggal_piutang ? new Date(row.tanggal_piutang).toLocaleDateString() : '-'}</TableCell>
        <TableCell>
          <Chip 
            label={row.status || 'outstanding'} 
            color={getStatusColor(row.status)}
            size="small"
          />
        </TableCell>
        <TableCell>
          <IconButton color="primary" onClick={() => onOpen(row)} size="small"><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => onDelete(id)} size="small"><DeleteIcon /></IconButton>
          <IconButton color="info" onClick={() => onExpand(id)} size="small"><InfoIcon /></IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
          <Collapse in={expanded === id} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom>Piutang Details</Typography>
              {detailsLoading[id] ? (
                <Typography>Loading details...</Typography>
              ) : detailsMap[id] ? (
                <Box>
                  <Typography><strong>Customer ID:</strong> {detailsMap[id].id_customer || '-'}</Typography>
                  <Typography><strong>Description:</strong> {detailsMap[id].keterangan || '-'}</Typography>
                  <Typography><strong>Due Date:</strong> {detailsMap[id].tanggal_jatuh_tempo ? new Date(detailsMap[id].tanggal_jatuh_tempo).toLocaleDateString() : '-'}</Typography>
                  <Typography><strong>Created:</strong> {detailsMap[id].created_at ? new Date(detailsMap[id].created_at).toLocaleString() : '-'}</Typography>
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

function Piutangs() {
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

  const reloadPiutangs = useCallback(() => {
    setLoading(true);
    return getPiutangs()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setData(Array.isArray(items) ? items : []);
        setError(null);
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

  useEffect(() => {
    reloadPiutangs();
  }, [reloadPiutangs]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      showNotification('🔄 Refreshing piutangs...', 'info')
      reloadPiutangs().then(() => {
        showNotification(`✅ ${data.length} piutangs loaded`, 'success')
      }).catch(() => {
        showNotification('❌ Failed to refresh piutangs', 'error')
      })
    }
    
    window.addEventListener('app:refresh:piutangs', handleRefresh)
    return () => window.removeEventListener('app:refresh:piutangs', handleRefresh)
  }, [reloadPiutangs, data.length, showNotification])

  const searchQuery = searchParams.get('q') || ''
  const statusFilter = searchParams.get('status') || ''
  const customerFilter = searchParams.get('customer') || ''
  
  const filteredData = data.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const hay = `${row.id_piutang || row.id || ''} ${row.pelanggan_nama || row.customer_name || ''} ${row.keterangan || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (statusFilter) {
      if ((row.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    if (customerFilter) {
      if ((row.pelanggan_nama || row.customer_name || '').toLowerCase() !== customerFilter.toLowerCase()) return false;
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

  const handleExpandWithDetails = useCallback((id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!detailsMap[id] && !detailsLoading[id]) {
      setDetailsLoading((prev) => ({ ...prev, [id]: true }));
      getPiutangById(id)
        .then((res) => {
          setDetailsMap((prev) => ({ ...prev, [id]: res?.data?.data || res?.data || {} }));
        })
        .catch((err) => {
          console.error(`Failed to load details for piutang ${id}`, err);
          setDetailsMap((prev) => ({ ...prev, [id]: {} }));
        })
        .finally(() => {
          setDetailsLoading((prev) => ({ ...prev, [id]: false }));
        });
    }
  }, [expanded, detailsMap, detailsLoading]);

  // Filter options
  const statusFilterOptions = [
    { value: 'outstanding', label: 'Outstanding' },
    { value: 'lunas', label: 'Lunas' },
    { value: 'overdue', label: 'Overdue' }
  ]

  const customerFilterOptions = [
    ...new Set(data.map(d => d.pelanggan_nama || d.customer_name))
  ].filter(Boolean).map(c => ({ value: c, label: c }))

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
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            startIcon={<RefreshIcon />} 
            variant="outlined" 
            size="small" 
            onClick={() => window.dispatchEvent(new CustomEvent('app:refresh:piutangs'))}
          >
            Refresh
          </Button>
          <Button 
            startIcon={<AddIcon />} 
            variant="contained" 
            size="small" 
            onClick={() => handleOpen()}
          >
            Add Piutang
          </Button>
        </Box>
      </Box>

      {/* Piutangs Table */}
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
              <TableCell>Customer</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography>
                    {data.length === 0 ? 'No piutangs found' : 'No piutangs match current filters'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <PiutangRow
                  key={row.id_piutang || row.id}
                  row={row}
                  expanded={expanded}
                  detailsLoading={detailsLoading}
                  detailsMap={detailsMap}
                  onOpen={handleOpen}
                  onDelete={handleDelete}
                  onExpand={handleExpandWithDetails}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Box>

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