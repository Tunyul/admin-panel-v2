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
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/InfoOutlined';

import { getPayments, getPaymentById, createPayment, updatePayment, deletePayment } from '../api/payments';
import { verifyPayment } from '../api/payments';
import useNotificationStore from '../store/notificationStore';
import useLoadingStore from '../store/loadingStore';

export default function Payments() {
  const [data, setData] = useState([]);
  // loading and error states are used internally; keep them for future UX improvements
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [verifyConfirm, setVerifyConfirm] = useState({ open: false, id: null, loading: false, data: null, form: {} });
  const [expanded, setExpanded] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});
  const [detailsLoading, setDetailsLoading] = useState({});
  const { showNotification } = useNotificationStore();

  // reuse the same dark-mode TextField styles used in OrderDialog
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255,255,255,0.02)',
      color: '#fff',
      '& fieldset': { borderColor: 'rgba(148,163,184,0.12)' },
      '&:hover fieldset': { borderColor: '#60a5fa' },
      '&.Mui-focused fieldset': { borderColor: '#60a5fa', boxShadow: '0 0 0 6px rgba(96,165,250,0.04)' },
    },
    '& .MuiInputLabel-root': { color: '#60a5fa' },
  };

  const reloadPayments = () => {
    setLoading(true);
    // mark global busy
    useLoadingStore.getState().start();
    return getPayments()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setData(Array.isArray(items) ? items : []);
        setError(null);
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setData([]);
          setError('Data payments tidak ditemukan.');
        } else {
          setError('Gagal memuat data payments');
        }
      })
      .finally(() => {
        setLoading(false);
        useLoadingStore.getState().done();
      });
  };

  useEffect(() => {
    reloadPayments();
  }, []);


  const handleOpen = (item = {}) => {
    setForm(item);
    setErrors({});
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = () => {
    const newErrors = {};
    if (form.nominal == null || form.nominal === '') newErrors.nominal = 'Nominal wajib diisi';
    if (!form.tanggal || !form.tanggal.toString().trim()) newErrors.tanggal = 'Tanggal wajib diisi';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    const payload = {
      nominal: form.nominal != null ? Number(form.nominal) : 0,
      tanggal: form.tanggal || null,
      bukti: form.bukti || null,
      tipe: form.tipe || null,
      no_transaksi: form.no_transaksi || null,
      no_hp: form.no_hp || null,
    };
    const id = form.id_payment || form.id;
    const op = id ? updatePayment(id, payload) : createPayment(payload);
    op
      .then(() => {
        showNotification('Saved payment', 'success');
        handleClose();
        reloadPayments();
      })
      .catch(() => showNotification('Gagal menyimpan payment', 'error'));
  };

  const handleDelete = (id) => setDeleteConfirm({ open: true, id });
  const confirmDelete = () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    if (!id) return;
    deletePayment(id)
      .then(() => {
        showNotification('Payment deleted', 'info');
        reloadPayments();
      })
      .catch(() => showNotification('Gagal menghapus payment', 'error'));
  };
  const cancelDelete = () => setDeleteConfirm({ open: false, id: null });

  const handleVerify = (id) => {
    setVerifyConfirm({ open: true, id, loading: true, data: null, form: {} });
    // fetch detail to prefill form and show bukti preview
    useLoadingStore.getState().start();
    getPaymentById(id)
      .then((res) => {
        const details = res?.data?.data || res?.data || {};
        setVerifyConfirm({ open: true, id, loading: false, data: details, form: { nominal: details.nominal, tipe: details.tipe } });
      })
      .catch(() => {
        setVerifyConfirm({ open: true, id, loading: false, data: null, form: {} });
        showNotification('Gagal memuat data payment untuk verifikasi', 'error');
      })
      .finally(() => useLoadingStore.getState().done());
  };

  const cancelVerify = () => setVerifyConfirm({ open: false, id: null, loading: false, data: null, form: {} });

  const handleVerifyFormChange = (e) => setVerifyConfirm((s) => ({ ...s, form: { ...s.form, [e.target.name]: e.target.value } }));

  const confirmVerify = () => {
    const id = verifyConfirm.id;
    if (!id) return cancelVerify();
    setVerifyConfirm((s) => ({ ...s, loading: true }));
    // mark global busy
    useLoadingStore.getState().start();
    const payload = {
      nominal: verifyConfirm.form.nominal != null ? Number(verifyConfirm.form.nominal) : verifyConfirm.data?.nominal || 0,
      tipe: verifyConfirm.form.tipe || verifyConfirm.data?.tipe || null,
    };
    // Validate according to DB schema: nominal NOT NULL and tipe must be one of 'dp'|'pelunasan'
    if (!payload.nominal || Number(payload.nominal) <= 0) {
      showNotification('Nominal harus lebih dari 0', 'error');
      setVerifyConfirm((s) => ({ ...s, loading: false }));
      useLoadingStore.getState().done();
      return;
    }
    if (!payload.tipe || (payload.tipe !== 'dp' && payload.tipe !== 'pelunasan')) {
      showNotification('Tipe payment harus dipilih (dp atau pelunasan)', 'error');
      setVerifyConfirm((s) => ({ ...s, loading: false }));
      useLoadingStore.getState().done();
      return;
    }
    verifyPayment(id, payload)
      .then(() => {
        showNotification('Payment verified', 'success');
        cancelVerify();
        reloadPayments();
      })
      .catch(() => {
        showNotification('Gagal memverifikasi payment', 'error');
        setVerifyConfirm((s) => ({ ...s, loading: false }));
      })
      .finally(() => {
        useLoadingStore.getState().done();
      });
  };

  const handleExpandWithDetails = (id) => {
    const willExpand = expanded !== id;
    setExpanded(willExpand ? id : null);
    if (willExpand && !detailsMap[id]) {
      setDetailsLoading((s) => ({ ...s, [id]: true }));
      // mark busy for details fetch
      useLoadingStore.getState().start();
      getPaymentById(id)
        .then((res) => {
          const details = res?.data?.data || res?.data || {};
          setDetailsMap((s) => ({ ...s, [id]: details }));
        })
        .catch(() => {
          setDetailsMap((s) => ({ ...s, [id]: {} }));
          showNotification('Gagal memuat detail payment', 'error');
        })
        .finally(() => {
          setDetailsLoading((s) => ({ ...s, [id]: false }));
          useLoadingStore.getState().done();
        });
    }
  };

  // Show loading spinner while fetching initial payments
  // Keep after hooks so hooks order stays stable.
  if (_loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  return (
  <Box className="main-card" sx={{ bgcolor: 'rgba(35,41,70,0.98)', borderRadius: 4, p: { xs: 2, md: 2 }, width: '100%', mx: 'auto', mt: { xs: 2, md: 4 }, fontFamily: 'Poppins, Inter, Arial, sans-serif' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: '#ffe066', letterSpacing: 1 }}>
          Payments
        </Typography>
        <Button variant="contained" sx={{ bgcolor: '#ffe066', color: '#232946', fontWeight: 700, borderRadius: 3, textTransform: 'none' }} onClick={() => handleOpen()}>
          Add Payment
        </Button>
      </Box>

      <Paper elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none', width: '100%' }}>
        <Box className="table-responsive" sx={{ width: '100%', overflowX: 'auto' }}>
          <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(35,41,70,0.95)' }}>
              <TableCell sx={{ color: '#60a5fa', fontWeight: 700 }}>ID</TableCell>
              <TableCell sx={{ color: '#f472b6', fontWeight: 700 }}>Tanggal</TableCell>
              <TableCell sx={{ color: '#34d399', fontWeight: 700 }}>Nominal</TableCell>
              <TableCell sx={{ color: '#ffe066', fontWeight: 700 }}>Tipe</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>No Transaksi</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>No HP</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((row) => (
                <React.Fragment key={row.id_payment || row.id}>
                  <TableRow sx={{ '&:hover': { bgcolor: 'rgba(96,165,250,0.03)' } }}>
                    <TableCell sx={{ color: '#fff' }}>{row.id_payment || row.id}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{row.tanggal || '-'}</TableCell>
                    <TableCell sx={{ color: '#34d399' }}>{row.nominal != null ? `Rp${Number(row.nominal).toLocaleString('id-ID')}` : '-'}</TableCell>
                    <TableCell sx={{ color: '#ffe066' }}>{row.tipe || '-'}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{row.no_transaksi || '-'}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{row.no_hp || '-'}</TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(row.id_payment || row.id)}><DeleteIcon /></IconButton>
                      <Button variant="outlined" size="small" sx={{ ml: 1 }} onClick={() => handleVerify(row.id_payment || row.id)}>Verify</Button>
                      <IconButton color="info" onClick={() => handleExpandWithDetails(row.id_payment || row.id)}><InfoIcon /></IconButton>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0, border: 0, bgcolor: 'transparent' }}>
                      <Collapse in={expanded === (row.id_payment || row.id)} timeout="auto" unmountOnExit>
                        <Box sx={{ bgcolor: 'rgba(35,41,70,0.95)', borderRadius: 2, p: 2, mt: 1, mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ color: '#60a5fa', fontWeight: 700, mb: 1 }}>Payment Details</Typography>
                          {detailsLoading[row.id_payment || row.id] ? (
                            <Typography sx={{ color: '#60a5fa', fontStyle: 'italic' }}>Loading details...</Typography>
                          ) : (
                            <Box sx={{ color: '#fff' }}>
                              <Typography><strong>Bukti:</strong> {detailsMap[row.id_payment || row.id]?.bukti || row.bukti || '-'}</Typography>
                              <Typography><strong>No Transaksi:</strong> {detailsMap[row.id_payment || row.id]?.no_transaksi || row.no_transaksi || '-'}</Typography>
                              <Typography><strong>No HP:</strong> {detailsMap[row.id_payment || row.id]?.no_hp || row.no_hp || '-'}</Typography>
                              <Typography sx={{ mt: 1 }}><strong>Tipe:</strong> {detailsMap[row.id_payment || row.id]?.tipe || row.tipe || '-'}</Typography>
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
                <TableCell colSpan={7} align="center" sx={{ color: '#60a5fa', fontStyle: 'italic' }}>Belum ada data payment.</TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </Box>
        <Box className="table-bottom-space" />
      </Paper>

      <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 4, bgcolor: 'rgba(35,41,70,0.98)' } }}>
        <DialogTitle sx={{ color: '#ffe066', fontWeight: 700 }}>{form.id_payment ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="tanggal" label="Tanggal" type="datetime-local" fullWidth value={form.tanggal ? form.tanggal.replace(' ', 'T') : ''} onChange={handleChange} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#ffe066' } }} error={!!errors.tanggal} helperText={errors.tanggal || ''} />
          <TextField margin="dense" name="nominal" label="Nominal" type="number" fullWidth value={form.nominal != null ? form.nominal : ''} onChange={handleChange} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#60a5fa' } }} error={!!errors.nominal} helperText={errors.nominal || ''} />
          <TextField margin="dense" name="bukti" label="Bukti (URL/file)" type="text" fullWidth value={form.bukti || ''} onChange={handleChange} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#f472b6' } }} />
          <TextField select margin="dense" name="tipe" label="Tipe" fullWidth value={form.tipe || ''} onChange={handleChange} SelectProps={{ native: true }} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#fbbf24' } }}>
            <option value="">(pilih)</option>
            <option value="dp">dp</option>
            <option value="pelunasan">pelunasan</option>
          </TextField>
          <TextField margin="dense" name="no_transaksi" label="No Transaksi" type="text" fullWidth value={form.no_transaksi || ''} onChange={handleChange} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#a78bfa' } }} />
          <TextField margin="dense" name="no_hp" label="No HP" type="text" fullWidth value={form.no_hp || ''} onChange={handleChange} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#a78bfa' } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: '#fff' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#ffe066', color: '#232946', fontWeight: 700, borderRadius: 3 }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm.open} onClose={cancelDelete} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>Hapus payment</DialogTitle>
        <DialogContent>
          <Typography>Yakin ingin menghapus payment ini?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Batal</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Hapus</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={verifyConfirm.open} onClose={cancelVerify} PaperProps={{ sx: { borderRadius: 4, bgcolor: 'rgba(35,41,70,0.98)', width: { xs: '94%', sm: '640px' }, maxWidth: '960px' } }}>
        <DialogTitle sx={{ color: '#ffe066', fontWeight: 700 }}>Verifikasi payment</DialogTitle>
        <DialogContent>
          {verifyConfirm.loading ? (
            <Typography sx={{ color: '#60a5fa' }}>Loading...</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Box sx={{ minWidth: 220, flex: '0 0 220px' }}>
                {verifyConfirm.data?.bukti || verifyConfirm.data?.bukti_url || verifyConfirm.data?.bukti_link || verifyConfirm.data?.bukti_file || verifyConfirm.data?.bukti ? (
                  <Box component="a" href={verifyConfirm.data?.bukti || verifyConfirm.data?.bukti_url || verifyConfirm.data?.bukti_link || verifyConfirm.data?.bukti_file} target="_blank" rel="noopener noreferrer">
                    <Box component="img" src={verifyConfirm.data?.bukti || verifyConfirm.data?.bukti_url || verifyConfirm.data?.bukti_link || verifyConfirm.data?.bukti_file} alt="Bukti pembayaran" sx={{ width: '100%', borderRadius: 2, boxShadow: '0 6px 18px rgba(0,0,0,0.6)' }} />
                  </Box>
                ) : (
                  <Typography sx={{ color: '#cbd5e1', fontStyle: 'italic' }}>Tidak ada bukti</Typography>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#60a5fa', fontWeight: 700, mb: 1 }}>Detail Pembayaran</Typography>
                <TextField
                  margin="dense"
                  name="nominal"
                  label="Nominal"
                  type="number"
                  fullWidth
                  value={verifyConfirm.form.nominal != null ? verifyConfirm.form.nominal : (verifyConfirm.data?.nominal ?? '')}
                  onChange={handleVerifyFormChange}
                  sx={inputSx}
                  InputProps={{
                    sx: { color: '#fff' },
                    // hide native number input spinner controls
                    inputProps: { inputMode: 'numeric' },
                    sx: {
                      '& input[type=number]': { MozAppearance: 'textfield' },
                      '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                      '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                      color: '#fff',
                    },
                  }}
                  InputLabelProps={{ sx: { color: '#60a5fa' } }}
                />

                <TextField
                  select
                  margin="dense"
                  name="tipe"
                  label="Tipe"
                  fullWidth
                  value={verifyConfirm.form.tipe || verifyConfirm.data?.tipe || ''}
                  onChange={handleVerifyFormChange}
                  SelectProps={{
                    MenuProps: { PaperProps: { sx: { bgcolor: 'rgba(15,23,42,0.98)', color: '#cbd5e1' } } },
                  }}
                  sx={inputSx}
                  InputProps={{ sx: { color: '#fff' } }}
                  InputLabelProps={{ sx: { color: '#fbbf24' } }}
                >
                  <MenuItem value="">(pilih)</MenuItem>
                  <MenuItem value="dp">dp</MenuItem>
                  <MenuItem value="pelunasan">pelunasan</MenuItem>
                </TextField>
                <Typography sx={{ color: '#cbd5e1', mt: 1 }}>No Transaksi: {verifyConfirm.data?.no_transaksi || '-'}</Typography>
                <Typography sx={{ color: '#cbd5e1' }}>No HP: {verifyConfirm.data?.no_hp || '-'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cancelVerify} disabled={verifyConfirm.loading} sx={{ color: '#fff' }}>Batal</Button>
          <Button onClick={confirmVerify} variant="contained" disabled={verifyConfirm.loading} sx={{ bgcolor: '#34d399', color: '#052e16', fontWeight: 700 }}>
            {verifyConfirm.loading ? 'Processing...' : 'Verifikasi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

