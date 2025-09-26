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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSearchParams } from 'react-router-dom';

import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../api/customers';
import useNotificationStore from '../store/notificationStore';
import TableToolbar from '../components/TableToolbar';

const CustomerRow = React.memo(function CustomerRow({ row, expanded, detailsMap, detailsLoading, onOpen, onDelete, onExpand }) {
  const id = row.id_customer || row.id;
  return (
    <>
      <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
        <TableCell>{id}</TableCell>
        <TableCell>{row.nama || row.nama_customer || '-'}</TableCell>
        <TableCell>{row.no_hp || '-'}</TableCell>
        <TableCell>{row.tipe_customer || '-'}</TableCell>
        <TableCell>{row.alamat || '-'}</TableCell>
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
              <Typography variant="subtitle2" gutterBottom>Customer Details</Typography>
              {detailsLoading[id] ? (
                <Typography>Loading details...</Typography>
              ) : detailsMap[id] ? (
                <Box>
                  <Typography><strong>Full Address:</strong> {detailsMap[id].alamat_lengkap || detailsMap[id].alamat || '-'}</Typography>
                  <Typography><strong>Email:</strong> {detailsMap[id].email || '-'}</Typography>
                  <Typography><strong>Registration Date:</strong> {detailsMap[id].tanggal_daftar ? new Date(detailsMap[id].tanggal_daftar).toLocaleDateString() : '-'}</Typography>
                  <Typography><strong>Notes:</strong> {detailsMap[id].catatan || '-'}</Typography>
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

function Customers() {
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

  const reloadCustomers = useCallback(() => {
    setLoading(true);
    return getCustomers()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        const arr = Array.isArray(items) ? items : [];
        setData(arr);
        setError(null);
        return arr;
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setData([]);
          setError('Data customer tidak ditemukan.');
        } else {
          setError('Gagal memuat data customers');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    reloadCustomers();
  }, [reloadCustomers]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      showNotification('🔄 Refreshing customers...', 'info')
      reloadCustomers()
        .then((items) => showNotification(`✅ ${Array.isArray(items) ? items.length : 0} customers loaded`, 'success'))
        .catch(() => showNotification('❌ Failed to refresh customers', 'error'))
    }

    window.addEventListener('app:refresh:customers', handleRefresh)
    return () => window.removeEventListener('app:refresh:customers', handleRefresh)
  }, [reloadCustomers, showNotification])

  const searchQuery = searchParams.get('q') || ''
  const typeFilter = searchParams.get('type') || ''
  
  const filteredData = data.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const hay = `${row.nama || row.nama_customer || ''} ${row.no_hp || ''} ${row.alamat || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (typeFilter) {
      if ((row.tipe_customer || '').toString() !== typeFilter) return false;
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
    if (!form.nama?.trim() && !form.nama_customer?.trim()) {
      newErrors.nama = 'Customer name is required';
    }
    if (!form.no_hp?.trim()) newErrors.no_hp = 'Phone number is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Normalize field names
    const customerData = {
      ...form,
      nama: form.nama || form.nama_customer,
      nama_customer: form.nama || form.nama_customer
    };

    const promise = form.id_customer || form.id ? 
      updateCustomer(form.id_customer || form.id, customerData) : 
      createCustomer(customerData);
      
    promise
      .then(() => {
        showNotification(`Customer ${form.id_customer || form.id ? 'updated' : 'created'} successfully`, 'success');
        handleClose();
        reloadCustomers();
      })
      .catch((err) => {
        showNotification(`Failed to ${form.id_customer || form.id ? 'update' : 'create'} customer`, 'error');
        console.error(err);
      });
  };

  const handleDelete = (id) => setDeleteConfirm({ open: true, id });

  const confirmDelete = () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    if (!id) return;
    
    deleteCustomer(id)
      .then(() => {
        showNotification('Customer deleted successfully', 'success');
        reloadCustomers();
      })
      .catch((err) => {
        showNotification('Failed to delete customer', 'error');
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
      getCustomerById(id)
        .then((res) => {
          setDetailsMap((prev) => ({ ...prev, [id]: res?.data || res }));
        })
        .catch((err) => {
          console.error(`Failed to load details for customer ${id}`, err);
          setDetailsMap((prev) => ({ ...prev, [id]: null }));
        })
        .finally(() => {
          setDetailsLoading((prev) => ({ ...prev, [id]: false }));
        });
    }
  }, [expanded, detailsMap, detailsLoading]);

  // Customer type filter options
  const typeFilterOptions = [
    ...new Set(data.map(d => d.tipe_customer))
  ].filter(Boolean).map(c => ({ value: c, label: c }))

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          <TableToolbar
            value={searchQuery}
            onChange={(value) => updateParam('q', value)}
            placeholder="Search customers (name, phone, address)"
            hideFilters
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            startIcon={<RefreshIcon />} 
            variant="outlined" 
            size="small" 
            onClick={() => window.dispatchEvent(new CustomEvent('app:refresh:customers'))}
          >
            Refresh
          </Button>
          <Button 
            startIcon={<AddIcon />} 
            variant="contained" 
            size="small" 
            onClick={() => handleOpen()}
          >
            Add Customer
          </Button>
        </Box>
      </Box>

      {/* Filters Row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TableToolbar
          hideSearch
          filterValue={typeFilter}
          onFilterChange={(value) => updateParam('type', value)}
          filterOptions={typeFilterOptions}
        />
      </Box>

      {/* Customers Table */}
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
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography>
                    {data.length === 0 ? 'No customers found' : 'No customers match current filters'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <CustomerRow
                  key={row.id_customer || row.id}
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

      {/* Add/Edit Customer Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id_customer || form.id ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Customer Name"
              name="nama"
              value={form.nama || form.nama_customer || ''}
              onChange={handleChange}
              error={!!errors.nama}
              helperText={errors.nama}
              fullWidth
            />
            <TextField
              label="Phone Number"
              name="no_hp"
              value={form.no_hp || ''}
              onChange={handleChange}
              error={!!errors.no_hp}
              helperText={errors.no_hp}
              fullWidth
            />
            <TextField
              label="Customer Type"
              name="tipe_customer"
              value={form.tipe_customer || ''}
              onChange={handleChange}
              error={!!errors.tipe_customer}
              helperText={errors.tipe_customer}
              fullWidth
            />
            <TextField
              label="Address"
              name="alamat"
              value={form.alamat || ''}
              onChange={handleChange}
              error={!!errors.alamat}
              helperText={errors.alamat}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email || ''}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
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
          <Typography>Are you sure you want to delete this customer?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Customers;