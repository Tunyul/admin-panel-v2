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
  Paper,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/InfoOutlined';

import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../api/customers';
import useNotificationStore from '../store/notificationStore';
import useLoadingStore from '../store/loadingStore';
import TableToolbar from '../components/TableToolbar';

const CustomerRow = React.memo(function CustomerRow({ row, expanded, detailsMap, detailsLoading, onOpen, onDelete, onExpand }) {
  const id = row.id_customer || row.id;
  return (
    <>
  <TableRow sx={{ '&:hover': { bgcolor: 'rgba(var(--accent-rgb),0.06)' } }}>
        <TableCell sx={{ color: 'var(--text)' }}>{id}</TableCell>
        <TableCell sx={{ color: 'var(--text)' }}>{row.nama || '-'}</TableCell>
        <TableCell sx={{ color: 'var(--accent)' }}>{row.no_hp || '-'}</TableCell>
        <TableCell sx={{ color: 'var(--accent-2)' }}>{row.tipe_customer || '-'}</TableCell>
        <TableCell>
          <IconButton color="primary" onClick={() => onOpen(row)}><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => onDelete(id)}><DeleteIcon /></IconButton>
          <IconButton color="info" onClick={() => onExpand(id)}><InfoIcon /></IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={5} sx={{ p: 0, border: 0, bgcolor: 'transparent' }}>
          <Collapse in={expanded === id} timeout="auto" unmountOnExit>
            <Box sx={{ bgcolor: 'var(--main-card-bg)', borderRadius: 2, p: 2, mt: 1, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: 'var(--accent-2)', fontWeight: 700, mb: 1 }}>Customer Details</Typography>
              {detailsLoading[id] ? (
                <Typography sx={{ color: 'var(--accent)', fontStyle: 'italic' }}>Loading details...</Typography>
              ) : (
                <Box sx={{ color: 'var(--text)' }}>
                  <Typography><strong>Nama:</strong> {detailsMap[id]?.nama || row.nama}</Typography>
                  <Typography><strong>No HP:</strong> {detailsMap[id]?.no_hp || row.no_hp}</Typography>
                  <Typography><strong>Tipe:</strong> {detailsMap[id]?.tipe_customer || row.tipe_customer}</Typography>
                  <Typography><strong>Batas Piutang:</strong> {detailsMap[id]?.batas_piutang || row.batas_piutang || '-'}</Typography>
                  <Typography sx={{ mt: 1 }}><strong>Catatan:</strong> {detailsMap[id]?.catatan || row.catatan || '-'}</Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
});

function Customers() {
  const [data, setData] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [expanded, setExpanded] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});
  const [detailsLoading, setDetailsLoading] = useState({});
  const { showNotification } = useNotificationStore();

  const reloadCustomers = useCallback(() => {
    setLoading(true);
    // mark global busy
    useLoadingStore.getState().start();
    return getCustomers()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setData(Array.isArray(items) ? items : []);
        setError(null);
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
        useLoadingStore.getState().done();
      });
  }, []);

  useEffect(() => {
    reloadCustomers();
  }, [reloadCustomers]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const filteredData = data.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const hay = `${row.nama || ''} ${row.no_hp || ''} ${row.tipe_customer || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (typeFilter) {
      if ((row.tipe_customer || '').toString() !== typeFilter) return false;
    }
    return true;
  });


  const handleOpen = useCallback((item = {}) => { setForm(item); setOpen(true); }, []);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleChange = useCallback((e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value })), []);
  const handleSave = () => {
    // Validation
    const newErrors = {};
    if (!form.nama || !form.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!form.no_hp || !form.no_hp.trim()) newErrors.no_hp = 'No HP wajib diisi';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    // Build payload matching MySQL schema
    const payload = {
      nama: form.nama,
      no_hp: form.no_hp,
      tipe_customer: form.tipe_customer || 'reguler',
      batas_piutang: form.batas_piutang || null,
      catatan: form.catatan || null,
    };
    const op = form.id_customer ? updateCustomer(form.id_customer, payload) : createCustomer(payload);
    op
      .then(() => {
        showNotification('Saved customer', 'success');
        handleClose();
        reloadCustomers();
      })
      .catch(() => showNotification('Gagal menyimpan customer', 'error'));
  };

  const handleDelete = useCallback((id) => { setDeleteConfirm({ open: true, id }); }, []);

  const confirmDelete = () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    if (!id) return;
    deleteCustomer(id)
      .then(() => {
        showNotification('Customer deleted', 'info');
        reloadCustomers();
      })
      .catch(() => showNotification('Gagal menghapus customer', 'error'));
  };

  const cancelDelete = () => setDeleteConfirm({ open: false, id: null });

  const handleExpandWithDetails = useCallback((id) => {
    setExpanded((prev) => (prev !== id ? id : null));
    if (!detailsMap[id]) {
      setDetailsLoading((s) => ({ ...s, [id]: true }));
      useLoadingStore.getState().start();
      getCustomerById(id)
        .then((res) => {
          const details = res?.data?.data || res?.data || {};
          setDetailsMap((s) => ({ ...s, [id]: details }));
        })
        .catch(() => {
          setDetailsMap((s) => ({ ...s, [id]: {} }));
          showNotification('Gagal memuat detail customer', 'error');
        })
        .finally(() => {
          setDetailsLoading((s) => ({ ...s, [id]: false }));
          useLoadingStore.getState().done();
        });
    }
  }, [detailsMap, showNotification]);

  // Show a loading spinner while initial load is happening.
  // Keep this after hooks/callbacks so hook order is stable.
  if (_loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  return (
  <Box className="main-card" sx={{ bgcolor: 'var(--main-card-bg)', borderRadius: 4, boxShadow: '0 0 24px #fbbf2433', p: { xs: 2, md: 2 }, width: '100%', mx: 'auto', mt: { xs: 2, md: 4 }, fontFamily: 'Poppins, Inter, Arial, sans-serif' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: '#ffe066', letterSpacing: 1 }}>
          Customers
        </Typography>
  <Button variant="contained" sx={{ bgcolor: '#ffe066', color: 'var(--button-text)', fontWeight: 700, borderRadius: 3, textTransform: 'none' }} onClick={() => handleOpen()}>
          Add Customer
        </Button>
      </Box>

      <Paper elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none', width: '100%' }}>
        <Box className="table-responsive" sx={{ width: '100%', overflowX: 'auto' }}>
          <TableToolbar value={searchQuery} onChange={setSearchQuery} placeholder="Search customers by name or phone" filterValue={typeFilter} onFilterChange={setTypeFilter} filterOptions={[{ value: 'reguler', label: 'Reguler' }, { value: 'vip', label: 'VIP' }, { value: 'hutang', label: 'Hutang' }]} />
          <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'transparent' }}>
              <TableCell sx={{ color: 'var(--accent-2)', fontWeight: 700 }}>ID</TableCell>
              <TableCell sx={{ color: 'var(--accent-2)', fontWeight: 700 }}>Nama</TableCell>
              <TableCell sx={{ color: 'var(--accent)', fontWeight: 700 }}>No HP</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Tipe</TableCell>
              <TableCell sx={{ color: 'var(--text)', fontWeight: 700 }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((row) => (
                <CustomerRow
                  key={row.id_customer || row.id}
                  row={row}
                  expanded={expanded}
                  detailsMap={detailsMap}
                  detailsLoading={detailsLoading}
                  onOpen={handleOpen}
                  onDelete={handleDelete}
                  onExpand={handleExpandWithDetails}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: 'var(--accent-2)', fontStyle: 'italic' }}>
                  Belum ada data customer.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </Box>
        <Box className="table-bottom-space" />
      </Paper>

  <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 4, bgcolor: 'var(--panel)' } }}>
        <DialogTitle sx={{ color: '#ffe066', fontWeight: 700 }}>{form.id_customer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="nama" label="Nama" type="text" fullWidth value={form.nama || ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--accent-2)' } }} error={!!errors.nama} helperText={errors.nama || ''} />
          <TextField margin="dense" name="no_hp" label="No HP" type="text" fullWidth value={form.no_hp || ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--accent)' } }} error={!!errors.no_hp} helperText={errors.no_hp || ''} />
          <TextField select margin="dense" name="tipe_customer" label="Tipe Customer" fullWidth value={form.tipe_customer || 'reguler'} onChange={handleChange} SelectProps={{ native: true }} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--muted)' } }}>
            <option value="reguler">reguler</option>
            <option value="vip">vip</option>
            <option value="hutang">hutang</option>
          </TextField>
          <TextField margin="dense" name="batas_piutang" label="Batas Piutang" type="datetime-local" fullWidth value={form.batas_piutang ? form.batas_piutang.replace(' ', 'T') : ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--accent-2)' } }} />
          <TextField margin="dense" name="catatan" label="Catatan" type="text" fullWidth multiline rows={3} value={form.catatan || ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--muted)' } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: 'var(--text)' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#ffe066', color: 'var(--button-text)', fontWeight: 700, borderRadius: 3 }}>Save</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteConfirm.open} onClose={cancelDelete} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>Hapus customer</DialogTitle>
        <DialogContent>
          <Typography>Yakin ingin menghapus customer ini?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Batal</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Hapus</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Customers;


