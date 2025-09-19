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

// reuse modal scrollbar style from Orders for consistent look
const scrollbarStyle = `
  ::-webkit-scrollbar {
    width: 10px;
    background: transparent;
    border-radius: 8px;
  }
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(120deg, rgba(var(--accent-2-rgb),0.26), rgba(var(--accent-rgb),0.26));
    border-radius: 8px;
    box-shadow: 0 0 8px rgba(var(--text-rgb),0.06);
  }
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(120deg, rgba(var(--accent-2-rgb),0.36), rgba(var(--accent-rgb),0.36));
  }
`;

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

  // Loading early-return removed — always render page; _loading only disables actions where used.

  return (
  <Box className="main-card" sx={{ bgcolor: 'var(--main-card-bg)', borderRadius: 4, boxShadow: '0 0 24px #fbbf2433', px: { xs: 2, md: 2 }, pt: { xs: 1.5, md: 2 }, width: '100%', mt: { xs: 2, md: 4 }, fontFamily: 'Poppins, Inter, Arial, sans-serif' }}>
    <style>{scrollbarStyle}</style>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#ffe066', letterSpacing: 1, mt: 0 }}>
            Customers
          </Typography>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableToolbar value={searchQuery} onChange={setSearchQuery} placeholder="Search customers by name or phone" filterValue={typeFilter} onFilterChange={setTypeFilter} filterOptions={[{ value: 'reguler', label: 'Reguler' }, { value: 'vip', label: 'VIP' }, { value: 'hutang', label: 'Hutang' }]} noWrap={true} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="contained" sx={{ bgcolor: '#ffe066', color: 'var(--button-text)', fontWeight: 700, borderRadius: 3, boxShadow: '0 0 8px #ffe06655', '&:hover': { bgcolor: '#ffd60a' }, textTransform: 'none' }} onClick={() => handleOpen()}>
            Add Customer
          </Button>
        </Box>
      </Box>

          <Paper elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none', width: '100%' }}>
            <Box sx={{ width: '100%', height: { xs: 520, md: 720 }, borderRadius: 0, p: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'hidden', minHeight: 0 }}>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'hidden', pt: 0, px: 0, pb: 2, minHeight: 0 }}>
                <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2, px: 2 }}>
                  <TableToolbar value={searchQuery} onChange={setSearchQuery} placeholder="Search customers by name or phone" filterValue={typeFilter} onFilterChange={setTypeFilter} filterOptions={[{ value: 'reguler', label: 'Reguler' }, { value: 'vip', label: 'VIP' }, { value: 'hutang', label: 'Hutang' }]} />
                </Box>
                <Box
                  className="modal-scroll"
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    overflowX: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--scroll-thumb-color) var(--scroll-track-color)',
                    '&::-webkit-scrollbar': { width: 10, height: 10 },
                    '&::-webkit-scrollbar-track': { background: 'var(--scroll-track, transparent)' },
                    '&::-webkit-scrollbar-thumb': { background: 'var(--scroll-thumb)', borderRadius: 8, boxShadow: '0 0 8px rgba(var(--text-rgb),0.06)' },
                    '&::-webkit-scrollbar-thumb:hover': { background: 'var(--scroll-thumb)' },
                  }}
                >
                  <Table sx={{ tableLayout: 'fixed', minWidth: { xs: 600, md: 900 }, width: '100%', '& .MuiTableCell-root': { boxSizing: 'border-box', padding: '0.75rem 0.75rem' } }}>
                    <colgroup>
                      <col style={{ width: '120px' }} />
                      <col style={{ width: '320px' }} />
                      <col style={{ width: '220px' }} />
                      <col style={{ width: '200px' }} />
                      <col style={{ width: '140px' }} />
                    </colgroup>
                    <TableHead sx={{ position: 'sticky', top: 0, zIndex: 1200, background: 'var(--main-card-bg)' }}>
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
              </Box>
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


