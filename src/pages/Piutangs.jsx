import React, { useEffect, useState } from 'react';
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

import { getPiutangs, getPiutangById, createPiutang, updatePiutang, deletePiutang } from '../api/piutangs';
import useNotificationStore from '../store/notificationStore';
import useLoadingStore from '../store/loadingStore';
import TableToolbar from '../components/TableToolbar';

export default function Piutangs() {
  const [data, setData] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});
  const [detailsLoading, setDetailsLoading] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const { showNotification } = useNotificationStore();

  const reloadPiutangs = () => {
    setLoading(true);
    // mark global busy
    useLoadingStore.getState().start();
    return getPiutangs()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setData(Array.isArray(items) ? items : []);
      })
      .catch(() => showNotification('Gagal memuat piutangs', 'error'))
      .finally(() => {
        setLoading(false);
        useLoadingStore.getState().done();
      });
  };

  useEffect(() => {
    // intentionally run once on mount; reloadPiutangs is stable here
    reloadPiutangs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const filteredData = data.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const hay = `${row.id_piutang || row.id || ''} ${row.pelanggan_nama || row.id_customer || ''} ${row.keterangan || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (statusFilter) {
      if ((row.status || '').toString() !== statusFilter) return false;
    }
    return true;
  });


  const handleOpen = (item = {}) => {
    setForm(item);
    setErrors({});
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = () => {
    const newErrors = {};
    if (!form.id_customer || !form.id_customer.toString().trim()) newErrors.id_customer = 'Customer ID wajib diisi';
    if (form.jumlah_piutang == null || form.jumlah_piutang === '') newErrors.jumlah_piutang = 'Jumlah piutang wajib diisi';
    if (!form.tanggal_piutang || !form.tanggal_piutang.toString().trim()) newErrors.tanggal_piutang = 'Tanggal piutang wajib diisi';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    const payload = {
      id_customer: form.id_customer || null,
      jumlah_piutang: form.jumlah_piutang != null ? Number(form.jumlah_piutang) : 0,
      tanggal_piutang: form.tanggal_piutang || null,
      status: form.status || null,
      keterangan: form.keterangan || null,
    };
    const id = form.id_piutang || form.id;
    const op = id ? updatePiutang(id, payload) : createPiutang(payload);
    op
      .then(() => {
        showNotification('Saved piutang', 'success');
        handleClose();
        reloadPiutangs();
      })
      .catch(() => showNotification('Gagal menyimpan piutang', 'error'));
  };

  const handleDelete = (id) => setDeleteConfirm({ open: true, id });
  const confirmDelete = () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    if (!id) return;
    deletePiutang(id)
      .then(() => {
        showNotification('Piutang deleted', 'info');
        reloadPiutangs();
      })
      .catch(() => showNotification('Gagal menghapus piutang', 'error'));
  };
  const cancelDelete = () => setDeleteConfirm({ open: false, id: null });

  const handleExpandWithDetails = (id) => {
    const willExpand = expanded !== id;
    setExpanded(willExpand ? id : null);
    if (willExpand && !detailsMap[id]) {
      setDetailsLoading((s) => ({ ...s, [id]: true }));
      // mark busy for details fetch
      useLoadingStore.getState().start();
      getPiutangById(id)
        .then((res) => {
          const details = res?.data?.data || res?.data || {};
          setDetailsMap((s) => ({ ...s, [id]: details }));
        })
        .catch(() => {
          setDetailsMap((s) => ({ ...s, [id]: {} }));
          showNotification('Gagal memuat detail piutang', 'error');
        })
        .finally(() => {
          setDetailsLoading((s) => ({ ...s, [id]: false }));
          useLoadingStore.getState().done();
        });
    }
  };

  // Keep loading spinner after hooks/callbacks to ensure hook order stability
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
          Piutangs
        </Typography>
  <Button variant="contained" sx={{ bgcolor: '#ffe066', color: 'var(--button-text)', fontWeight: 700, borderRadius: 3, textTransform: 'none' }} onClick={() => handleOpen()}>
          Add Piutang
        </Button>
      </Box>

      <Paper elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none', width: '100%' }}>
        <Box className="table-responsive" sx={{ width: '100%', overflowX: 'auto' }}>
          <TableToolbar value={searchQuery} onChange={setSearchQuery} placeholder="Search piutangs" filterValue={statusFilter} onFilterChange={setStatusFilter} filterOptions={[{ value: 'open', label: 'Open' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }]} />
          <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'transparent' }}>
              <TableCell sx={{ color: 'var(--accent-2)', fontWeight: 700 }}>ID</TableCell>
              <TableCell sx={{ color: 'var(--accent-2)', fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ color: 'var(--accent)', fontWeight: 700 }}>Jumlah</TableCell>
              <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Tanggal</TableCell>
              <TableCell sx={{ color: 'var(--text)', fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ color: 'var(--text)', fontWeight: 700 }}>Keterangan</TableCell>
              <TableCell sx={{ color: 'var(--text)', fontWeight: 700 }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((row) => (
                <React.Fragment key={row.id_piutang || row.id}>
          <TableRow sx={{ '&:hover': { bgcolor: 'rgba(var(--accent-rgb),0.06)' } }}>
                    <TableCell sx={{ color: 'var(--text)' }}>{row.id_piutang || row.id}</TableCell>
                    <TableCell sx={{ color: 'var(--text)' }}>{row.id_customer || row.pelanggan_nama || '-'}</TableCell>
            <TableCell sx={{ color: 'var(--accent)' }}>{row.jumlah_piutang != null ? `Rp${Number(row.jumlah_piutang).toLocaleString('id-ID')}` : '-'}</TableCell>
            <TableCell sx={{ color: 'var(--muted)' }}>{row.tanggal_piutang || '-'}</TableCell>
                    <TableCell sx={{ color: 'var(--text)' }}>{row.status || '-'}</TableCell>
                    <TableCell sx={{ color: 'var(--text)' }}>{row.keterangan || '-'}</TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(row.id_piutang || row.id)}><DeleteIcon /></IconButton>
                      <IconButton color="info" onClick={() => handleExpandWithDetails(row.id_piutang || row.id)}><InfoIcon /></IconButton>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0, border: 0, bgcolor: 'transparent' }}>
                      <Collapse in={expanded === (row.id_piutang || row.id)} timeout="auto" unmountOnExit>
                        <Box sx={{ bgcolor: 'var(--main-card-bg)', borderRadius: 2, p: 2, mt: 1, mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ color: '#60a5fa', fontWeight: 700, mb: 1 }}>Piutang Details</Typography>
                          {detailsLoading[row.id_piutang || row.id] ? (
                            <Typography sx={{ color: '#60a5fa', fontStyle: 'italic' }}>Loading details...</Typography>
                          ) : (
                            <Box sx={{ color: 'var(--text)' }}>
                              <Typography><strong>Jumlah:</strong> {detailsMap[row.id_piutang || row.id]?.jumlah_piutang || row.jumlah_piutang || '-'}</Typography>
                              <Typography><strong>Tanggal:</strong> {detailsMap[row.id_piutang || row.id]?.tanggal_piutang || row.tanggal_piutang || '-'}</Typography>
                              <Typography><strong>Status:</strong> {detailsMap[row.id_piutang || row.id]?.status || row.status || '-'}</Typography>
                              <Typography sx={{ mt: 1 }}><strong>Keterangan:</strong> {detailsMap[row.id_piutang || row.id]?.keterangan || row.keterangan || '-'}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: '#60a5fa', fontStyle: 'italic' }}>Belum ada data piutang.</TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </Box>
        <Box className="table-bottom-space" />
      </Paper>

  <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 4, bgcolor: 'var(--panel)' } }}>
        <DialogTitle sx={{ color: '#ffe066', fontWeight: 700 }}>{form.id_piutang ? 'Edit Piutang' : 'Add Piutang'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="id_customer" label="Customer ID" type="text" fullWidth value={form.id_customer || ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--accent-2)' } }} error={!!errors.id_customer} helperText={errors.id_customer || ''} />
          <TextField margin="dense" name="jumlah_piutang" label="Jumlah Piutang" type="number" fullWidth value={form.jumlah_piutang != null ? form.jumlah_piutang : ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--accent)' } }} error={!!errors.jumlah_piutang} helperText={errors.jumlah_piutang || ''} />
          <TextField margin="dense" name="tanggal_piutang" label="Tanggal Piutang" type="datetime-local" fullWidth value={form.tanggal_piutang ? form.tanggal_piutang.replace(' ', 'T') : ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--muted)' } }} error={!!errors.tanggal_piutang} helperText={errors.tanggal_piutang || ''} />
          <TextField select margin="dense" name="status" label="Status" fullWidth value={form.status || ''} onChange={handleChange} SelectProps={{ native: true }} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--accent-2)' } }}>
            <option value="">(pilih)</option>
            <option value="open">open</option>
            <option value="paid">paid</option>
            <option value="overdue">overdue</option>
          </TextField>
          <TextField margin="dense" name="keterangan" label="Keterangan" type="text" fullWidth multiline rows={3} value={form.keterangan || ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--muted)' } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: 'var(--text)' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#ffe066', color: 'var(--button-text)', fontWeight: 700, borderRadius: 3 }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm.open} onClose={cancelDelete} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>Hapus piutang</DialogTitle>
        <DialogContent>
          <Typography>Yakin ingin menghapus piutang ini?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Batal</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Hapus</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
