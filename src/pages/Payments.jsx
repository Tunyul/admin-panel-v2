import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/InfoOutlined';

import { getPayments, getPaymentById, createPayment, updatePayment, deletePayment, approvePaymentNominal } from '../api/payments';
import { verifyPayment } from '../api/payments';
import useNotificationStore from '../store/notificationStore';
import useLoadingStore from '../store/loadingStore';
import TableToolbar from '../components/TableToolbar';

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
  const { showNotification, prependItem, incrementUnread } = useNotificationStore();

  // reuse the same dark-mode TextField styles used in OrderDialog
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255,255,255,0.02)',
      color: 'var(--text)',
      '& fieldset': { borderColor: 'rgba(148,163,184,0.12)' },
      '&:hover fieldset': { borderColor: 'var(--accent)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--accent)', boxShadow: '0 0 0 6px rgba(var(--accent-rgb),0.04)' },
    },
    '& .MuiInputLabel-root': { color: 'var(--accent)' },
  };

  const reloadPayments = () => {
    setLoading(true);
    // mark global busy
    useLoadingStore.getState().start();
    return getPayments()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        // Deduplicate by id_payment or id to avoid duplicate rows when backend returns duplicates
        const arr = Array.isArray(items) ? items : [];
        const map = new Map();
        arr.forEach((it) => {
          const key = it?.id_payment ?? it?.id ?? JSON.stringify(it);
          if (!map.has(key)) map.set(key, it);
        });
        setData(Array.from(map.values()));
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

  // auto-open verify modal if query param present
  const location = useLocation();
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const toOpen = params.get('open_verify');
    if (toOpen && !autoOpenedRef.current) {
      // try to open verify modal for this id after a short delay to ensure data loaded
      autoOpenedRef.current = true;
      setTimeout(() => {
        handleVerify(toOpen);
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const filteredData = data.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const hay = `${row.no_transaksi || ''} ${row.no_hp || ''} ${row.id_payment || row.id || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (typeFilter) {
      if ((row.tipe || '').toString() !== typeFilter) return false;
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
    // Use approve endpoint as backend expects PUT /api/payments/approve/:id with { nominal }
    approvePaymentNominal(id, payload.nominal)
      .then(() => {
        showNotification('Payment approved & verified', 'success');
        try {
          const item = {
            id: `payment-approve-${id}-${Date.now()}`,
            title: `Pembayaran diverifikasi: ${verifyConfirm.data?.no_transaksi || id}`,
            message: `Nominal: Rp${Number(payload.nominal).toLocaleString('id-ID')}`,
            no_transaksi: verifyConfirm.data?.no_transaksi,
            nominal: payload.nominal,
            status: 'approved',
            timestamp: new Date().toISOString(),
            read: false,
          };
          prependItem(item);
          incrementUnread(1);
        } catch (e) {
          // ignore
        }
        cancelVerify();
        reloadPayments();
      })
      .catch((err) => {
        // if approve endpoint not available, fallback to verifyPayment
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          verifyPayment(id, payload)
            .then(() => {
              showNotification('Payment verified (fallback)', 'success');
              try {
                const item = {
                  id: `payment-verify-${id}-${Date.now()}`,
                  title: `Pembayaran diverifikasi: ${verifyConfirm.data?.no_transaksi || id}`,
                  message: `Nominal: Rp${Number(payload.nominal).toLocaleString('id-ID')}`,
                  no_transaksi: verifyConfirm.data?.no_transaksi,
                  nominal: payload.nominal,
                  status: 'verified',
                  timestamp: new Date().toISOString(),
                  read: false,
                };
                prependItem(item);
                incrementUnread(1);
              } catch (e) {
                // ignore
              }
              cancelVerify();
              reloadPayments();
            })
            .catch(() => {
              showNotification('Gagal memverifikasi payment (fallback)', 'error');
              setVerifyConfirm((s) => ({ ...s, loading: false }));
            })
            .finally(() => useLoadingStore.getState().done());
          return;
        }
        showNotification('Gagal approve payment', 'error');
        setVerifyConfirm((s) => ({ ...s, loading: false }));
      })
      .finally(() => useLoadingStore.getState().done());
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

  // Loading early-return removed — always render page; _loading only disables actions where used.

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

  return (
  <Box className="main-card" sx={{ bgcolor: 'var(--main-card-bg)', borderRadius: 4, boxShadow: '0 0 24px #fbbf2433', px: { xs: 2, md: 2 }, pt: { xs: 1.5, md: 2 }, width: '100%', mt: { xs: 2, md: 4 }, fontFamily: 'Poppins, Inter, Arial, sans-serif' }}>
    <style>{scrollbarStyle}</style>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: '#ffe066', letterSpacing: 1, mt: 0 }}>
          Payments
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableToolbar value={searchQuery} onChange={setSearchQuery} placeholder="Search payments" filterValue={typeFilter} onFilterChange={setTypeFilter} filterOptions={[{ value: 'dp', label: 'DP' }, { value: 'pelunasan', label: 'Pelunasan' }]} noWrap={true} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="contained" sx={{ bgcolor: '#ffe066', color: 'var(--button-text)', fontWeight: 700, borderRadius: 3, boxShadow: '0 0 8px #ffe06655', '&:hover': { bgcolor: '#ffd60a' }, textTransform: 'none' }} onClick={() => handleOpen()}>
          Add Payment
        </Button>
      </Box>
    </Box>

    <Paper elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none', width: '100%' }}>
      <Box sx={{ width: '100%', height: { xs: 520, md: 720 }, borderRadius: 0, p: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'hidden', minHeight: 0 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'hidden', pt: 0, px: 0, pb: 2, minHeight: 0 }}>
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2, px: 2 }}>
            <TableToolbar value={searchQuery} onChange={setSearchQuery} placeholder="Search payments" filterValue={typeFilter} onFilterChange={setTypeFilter} filterOptions={[{ value: 'dp', label: 'DP' }, { value: 'pelunasan', label: 'Pelunasan' }]} />
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
            <Table sx={{ tableLayout: 'fixed', minWidth: { xs: 800, md: 1400 }, width: 'max-content', '& .MuiTableCell-root': { boxSizing: 'border-box', padding: '0.75rem 0.75rem' } }}>
              <colgroup>
                <col style={{ width: '120px' }} />
                <col style={{ width: '220px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '220px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: '180px' }} />
              </colgroup>
              <TableHead sx={{ position: 'sticky', top: 0, zIndex: 1200, background: 'var(--main-card-bg)' }}>
                <TableRow sx={{ bgcolor: 'transparent' }}>
                  <TableCell sx={{ color: 'var(--accent-2)', fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ color: 'var(--muted)', fontWeight: 700 }}>Tanggal</TableCell>
                  <TableCell sx={{ color: 'var(--accent)', fontWeight: 700 }}>Nominal</TableCell>
                  <TableCell sx={{ color: 'var(--accent-2)', fontWeight: 700 }}>Tipe</TableCell>
                  <TableCell sx={{ color: 'var(--text)', fontWeight: 700 }}>No Transaksi</TableCell>
                  <TableCell sx={{ color: 'var(--text)', fontWeight: 700 }}>No HP</TableCell>
                  <TableCell sx={{ color: 'var(--text)', fontWeight: 700 }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <React.Fragment key={row.id_payment || row.id}>
                      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(var(--accent-rgb),0.06)' } }}>
                        <TableCell sx={{ color: 'var(--text)' }}>{row.id_payment || row.id}</TableCell>
                        <TableCell sx={{ color: 'var(--text)' }}>{row.tanggal || '-'}</TableCell>
                        <TableCell sx={{ color: 'var(--accent)' }}>{row.nominal != null ? `Rp${Number(row.nominal).toLocaleString('id-ID')}` : '-'}</TableCell>
                        <TableCell sx={{ color: 'var(--accent-2)' }}>{row.tipe || '-'}</TableCell>
                        <TableCell sx={{ color: 'var(--text)' }}>{row.no_transaksi || '-'}</TableCell>
                        <TableCell sx={{ color: 'var(--text)' }}>{row.no_hp || '-'}</TableCell>
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
                            <Box sx={{ bgcolor: 'var(--main-card-bg)', borderRadius: 2, p: 2, mt: 1, mb: 2 }}>
                              <Typography variant="subtitle1" sx={{ color: 'var(--accent-2)', fontWeight: 700, mb: 1 }}>Payment Details</Typography>
                              {detailsLoading[row.id_payment || row.id] ? (
                                <Typography sx={{ color: '#60a5fa', fontStyle: 'italic' }}>Loading details...</Typography>
                              ) : (
                                <Box sx={{ color: 'var(--text)' }}>
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
                    <TableCell colSpan={7} align="center" sx={{ color: 'var(--accent-2)', fontStyle: 'italic' }}>Belum ada data payment.</TableCell>
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
        <DialogTitle sx={{ color: '#ffe066', fontWeight: 700 }}>{form.id_payment ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="tanggal" label="Tanggal" type="datetime-local" fullWidth value={form.tanggal ? form.tanggal.replace(' ', 'T') : ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--accent-2)' } }} error={!!errors.tanggal} helperText={errors.tanggal || ''} />
          <TextField margin="dense" name="nominal" label="Nominal" type="number" fullWidth value={form.nominal != null ? form.nominal : ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--accent)' } }} error={!!errors.nominal} helperText={errors.nominal || ''} />
          <TextField margin="dense" name="bukti" label="Bukti (URL/file)" type="text" fullWidth value={form.bukti || ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--muted)' } }} />
          <TextField select margin="dense" name="tipe" label="Tipe" fullWidth value={form.tipe || ''} onChange={handleChange} SelectProps={{ native: true }} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--accent-2)' } }}>
            <option value="">(pilih)</option>
            <option value="dp">dp</option>
            <option value="pelunasan">pelunasan</option>
          </TextField>
          <TextField margin="dense" name="no_transaksi" label="No Transaksi" type="text" fullWidth value={form.no_transaksi || ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--muted)' } }} />
          <TextField margin="dense" name="no_hp" label="No HP" type="text" fullWidth value={form.no_hp || ''} onChange={handleChange} InputProps={{ sx: { color: 'var(--text)' } }} InputLabelProps={{ sx: { color: 'var(--muted)' } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: 'var(--text)' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: 'var(--accent-2)', color: 'var(--button-text)', fontWeight: 700 }}>Save</Button>
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

  <Dialog open={verifyConfirm.open} onClose={cancelVerify} PaperProps={{ sx: { borderRadius: 4, bgcolor: 'var(--panel)', width: { xs: '94%', sm: '640px' }, maxWidth: '960px' } }}>
        <DialogTitle sx={{ color: '#ffe066', fontWeight: 700 }}>Verifikasi payment</DialogTitle>
        <DialogContent>
                {verifyConfirm.loading ? (
            <Typography sx={{ color: 'var(--accent-2)' }}>Loading...</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Box sx={{ minWidth: 220, flex: '0 0 220px' }}>
                {verifyConfirm.data?.bukti || verifyConfirm.data?.bukti_url || verifyConfirm.data?.bukti_link || verifyConfirm.data?.bukti_file || verifyConfirm.data?.bukti ? (
                  <Box component="a" href={verifyConfirm.data?.bukti || verifyConfirm.data?.bukti_url || verifyConfirm.data?.bukti_link || verifyConfirm.data?.bukti_file} target="_blank" rel="noopener noreferrer">
                    <Box component="img" src={verifyConfirm.data?.bukti || verifyConfirm.data?.bukti_url || verifyConfirm.data?.bukti_link || verifyConfirm.data?.bukti_file} alt="Bukti pembayaran" sx={{ width: '100%', borderRadius: 2, boxShadow: '0 6px 18px rgba(0,0,0,0.6)' }} />
                  </Box>
                ) : (
                  <Typography sx={{ color: 'var(--muted)', fontStyle: 'italic' }}>Tidak ada bukti</Typography>
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
                    // Merge styling and numeric input tweaks into a single `sx` object and keep inputProps
                    sx: {
                      color: 'var(--text)',
                      '& input[type=number]': { MozAppearance: 'textfield' },
                      '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                      '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                    },
                    // hide native number input spinner controls and set inputMode
                    inputProps: { inputMode: 'numeric' },
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
                    MenuProps: { PaperProps: { sx: { bgcolor: 'var(--panel)', color: 'var(--text)' } } },
                  }}
                  sx={inputSx}
                  InputProps={{ sx: { color: 'var(--text)' } }}
                  InputLabelProps={{ sx: { color: 'var(--accent-2)' } }}
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
          <Button onClick={cancelVerify} disabled={verifyConfirm.loading} sx={{ color: 'var(--text)' }}>Batal</Button>
          <Button onClick={confirmVerify} variant="contained" disabled={verifyConfirm.loading} sx={{ bgcolor: '#34d399', color: '#052e16', fontWeight: 700 }}>
            {verifyConfirm.loading ? 'Processing...' : 'Verifikasi'}
          </Button>
        </DialogActions>
      </Dialog>

      
    </Box>
  );
}

