import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Autocomplete,
  TextField,
  Button,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import useNotificationStore from '../store/notificationStore';
import { createCustomer, getCustomersByPhone } from '../api/customers';
import { createOrder as apiCreateOrder, updateOrder } from '../api/orders';
import { createOrderDetail } from '../api/orderDetail';

export default function OrderDialog({ open, onClose, productsList = [], customersList = [], onCreated }) {
  const [step, setStep] = useState('customer');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form, setForm] = useState({});
  const [orderLines, setOrderLines] = useState([]);
  const [localCustomers, setLocalCustomers] = useState(customersList || []);
  const { showNotification } = useNotificationStore();
  const searchDebounceRef = React.useRef(null);

  // shared dark-mode TextField styles for modal inputs
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

  useEffect(() => {
    if (open) {
      setStep('customer');
      setSelectedCustomer(null);
      setForm({});
      setOrderLines([{ produk_id: null, quantity: 1 }]);
    }
  }, [open]);

  useEffect(() => { setLocalCustomers(customersList || []); }, [customersList]);

  // cleanup debounce on unmount
  useEffect(() => () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); }, []);

  const handleLineChange = (index, key, value) => setOrderLines((lines) => {
    const c = [...lines];
    c[index] = { ...c[index], [key]: value };
    return c;
  });
  const addLine = () => setOrderLines((l) => ([...l, { produk_id: null, quantity: 1 }]));
  const removeLine = (i) => setOrderLines((l) => l.filter((_, idx) => idx !== i));
  const increment = (i) => setOrderLines((l) => l.map((ln, idx) => (idx === i ? ({ ...ln, quantity: (Number(ln.quantity) || 0) + 1 }) : ln)));
  const decrement = (i) => setOrderLines((l) => l.map((ln, idx) => (idx === i ? ({ ...ln, quantity: Math.max(0, (Number(ln.quantity) || 0) - 1) }) : ln)));

  const computeLineSubtotal = (line) => {
    const prod = productsList.find((p) => String(p.id_produk || p.id) === String(line.produk_id));
    const harga = prod?.harga_per_pcs || prod?.harga_per_m2 || 0;
    return harga * (Number(line.quantity) || 0);
  };
  const computeTotal = () => orderLines.reduce((s, l) => s + computeLineSubtotal(l), 0);

  const aggregateLines = () => {
    const map = {};
    for (const l of orderLines) {
      const pid = String(l.produk_id || '');
      if (!pid) continue;
      const qty = Number(l.quantity) || 0;
      if (!map[pid]) map[pid] = { produk_id: pid, quantity: qty };
      else map[pid].quantity += qty;
    }
    return Object.values(map);
  };

  const itemsValid = () => orderLines.length && orderLines.every((ln) => ln.produk_id && (Number(ln.quantity) || 0) > 0);

  const handleCustomerProceed = () => {
    if (!selectedCustomer && !form.customer_name) return showNotification('Pilih atau buat customer', 'error');
    setStep('items');
  };

  const handleCustomerCreate = () => {
    const name = form.customer_name || '';
    if (!name) return showNotification('Nama customer wajib', 'error');
    createCustomer({ nama: name, phone: form.customer_phone || null })
      .then((res) => {
        const cust = res?.data?.data || res?.data || { nama: name, phone: form.customer_phone };
        setSelectedCustomer(cust);
        showNotification('Customer dibuat', 'success');
        setStep('items');
      })
      .catch(() => showNotification('Gagal membuat customer', 'error'));
  };

  // back navigation logic for steps
  const handleBack = () => {
    if (step === 'summary') {
      // go back to items (keep current items)
      setStep('items');
      return;
    }
    if (step === 'items') {
      // reset customer selection/data and go back to customer step
      setSelectedCustomer(null);
      setForm((f) => ({ ...f, customer_name: '', customer_phone: '' }));
      setOrderLines([{ produk_id: null, quantity: 1 }]);
      // restore customer options
      setLocalCustomers(customersList || []);
      setStep('customer');
      return;
    }
    // default fallback: go to customer
    setStep('customer');
  };

  const handleConfirm = () => {
    const customer = selectedCustomer || form.customer;
    const customerId = customer?.id_customer || customer?.id || null;
    if (!customerId) return showNotification('Customer belum valid', 'error');
    const payload = { customer_id: customerId, tanggal_order: new Date().toISOString(), total_bayar: computeTotal(), catatan: form.catatan || null };
    const op = form.id_order ? updateOrder(form.id_order, payload) : apiCreateOrder(payload);
    op.then((res) => {
      const created = res?.data?.data || res?.data || {};
      const orderId = created.id_order || created.id || null;
      if (!orderId) throw new Error('Order id not returned');
      const promises = orderLines.map((line) => {
        const prod = productsList.find((p) => String(p.id_produk || p.id) === String(line.produk_id));
        const harga = prod?.harga_per_pcs || prod?.harga_per_m2 || 0;
        return createOrderDetail({ order_id: orderId, produk_id: prod?.id_produk || prod?.id || null, quantity: Number(line.quantity) || 0, harga_satuan: harga, subtotal_item: harga * (Number(line.quantity) || 0) });
      });
      return Promise.all(promises).then(() => orderId);
    }).then((orderId) => {
      showNotification('Order dibuat', 'success');
      onClose();
      if (onCreated) onCreated(orderId);
    }).catch(() => showNotification('Gagal membuat order', 'error'));
  };

  const resetAndClose = () => {
    setSelectedCustomer(null);
    setForm({});
    setOrderLines([{ produk_id: null, quantity: 1 }]);
    setLocalCustomers(customersList || []);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={resetAndClose}
      PaperProps={{ sx: { borderRadius: 4, bgcolor: 'rgba(35,41,70,0.98)', width: { xs: '94%', sm: '720px', md: '880px' }, maxWidth: '960px', maxHeight: '86vh', display: 'flex', flexDirection: 'column' } }}
    >
      <DialogTitle sx={{ color: '#ffe066', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <Box>
          {form.id_order ? 'Edit Order' : 'Add Order'}
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {['customer', 'items', 'summary'].map((sName, i) => {
                const active = step === sName;
                return (
                  <Box key={sName} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: active ? '#34d399' : 'transparent',
                      border: `1px solid ${active ? '#34d399' : 'rgba(148,163,184,0.12)'}`,
                    }}>
                      <Typography sx={{ color: active ? '#052e16' : '#cbd5e1', fontWeight: 700 }}>{i + 1}</Typography>
                    </Box>
                    <Box sx={{ minWidth: 70 }}>
                      <Typography sx={{ color: active ? '#fff' : '#888', fontWeight: active ? 700 : 600, fontSize: 13 }}>{active ? (sName === 'customer' ? 'Step 1' : sName === 'items' ? 'Step 2' : 'Step 3') : (sName === 'customer' ? 'Step 1' : sName === 'items' ? 'Step 2' : 'Step 3')}</Typography>
                    </Box>
                    {i < 2 && (
                      <Box sx={{ width: 56, height: 2, bgcolor: (step === sName || step === (i === 0 ? 'items' : 'summary')) ? '#34d399' : 'rgba(148,163,184,0.06)', borderRadius: 1 }} />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
        <IconButton onClick={resetAndClose} sx={{ color: '#fff', position: 'absolute', right: 12, top: 12 }} aria-label="close-dialog"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ overflowY: 'auto', px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, flex: 1 }}>
        {step === 'customer' && (
          <Box>
            <Typography sx={{ color: '#60a5fa', fontWeight: 700 }}>Customer</Typography>
            <Autocomplete
              freeSolo
              options={localCustomers || []}
              inputValue={form.customer_name || ''}
              onInputChange={(e, nv, reason) => {
                // preserve earlier onInputChange behavior while also keeping inputValue synced
                setForm((f) => ({ ...f, customer_name: nv }));
                if (reason === 'clear') { setSelectedCustomer(null); setForm((f) => ({ ...f, customer_name: '', customer_phone: '' })); setLocalCustomers(customersList || []); return; }

                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                const raw = (nv || '').trim();
                const digits = (raw.match(/\d/g) || []).length;
                const phoneLike = digits >= 3 && /^[+\d\s()\-]+$/.test(raw);
                if (phoneLike) {
                  searchDebounceRef.current = setTimeout(() => {
                    getCustomersByPhone(raw).then((res) => {
                      const list = res?.data?.data || res?.data || [];
                      setLocalCustomers(Array.isArray(list) ? list : []);
                    }).catch(() => {});
                  }, 400);
                } else {
                  const q = raw.toLowerCase();
                  if (!q) setLocalCustomers(customersList || []);
                  else setLocalCustomers((customersList || []).filter((c) => {
                    const name = (c.nama || c.name || '').toLowerCase();
                    const phone = String(c.phone || c.no_hp || '').toLowerCase();
                    return name.includes(q) || phone.includes(q);
                  }));
                }
              }}
              componentsProps={{
                paper: { sx: { bgcolor: 'rgba(15,23,42,0.98)', color: '#cbd5e1' } },
                listbox: { sx: { bgcolor: 'rgba(15,23,42,0.98)', color: '#cbd5e1' } }
              }}
              getOptionLabel={(o) => {
                if (typeof o === 'string') return o;
                const name = o?.nama || o?.name || '';
                const phone = o?.phone || o?.no_hp || '';
                return name && phone ? `${name} | ${phone}` : (name || phone || '');
              }}
              isOptionEqualToValue={(option, value) => String(option?.id_customer || option?.id || option?.id_customer) === String(value?.id_customer || value?.id || value)}
              onChange={(_e, v) => {
                if (!v) { setSelectedCustomer(null); setForm((f) => ({ ...f, customer_name: '', customer_phone: '' })); return; }
                if (typeof v === 'string') { setForm((f) => ({ ...f, customer_name: v })); setSelectedCustomer(null); }
                else { setSelectedCustomer(v); setForm((f) => ({ ...f, customer_name: v.nama || v.name, customer_phone: v.phone || v.no_hp })); }
              }}
              noOptionsText="Tidak ditemukan"
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: '#cbd5e1' }}>
                  <span>{option?.nama || option?.name || option || ''}</span>
                  <span>{option?.phone || option?.no_hp || ''}</span>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cari / ketik nama atau no HP"
                  margin="dense"
                  fullWidth
                  sx={inputSx}
                  InputProps={{ ...params.InputProps, sx: { color: '#fff' } }}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                />
              )}
            />
          </Box>
        )}

        {step === 'items' && (
          <Box>
            <Typography sx={{ color: '#60a5fa', fontWeight: 700 }}>Items</Typography>
            {orderLines.map((ln, idx) => {
              const prod = productsList.find((p) => String(p.id_produk || p.id) === String(ln.produk_id));
              return (
                    <Box key={idx} sx={{ p: 1, mb: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Autocomplete
                      options={productsList || []}
                      getOptionLabel={(opt) => {
                        if (!opt) return '';
                        if (typeof opt === 'string') return opt;
                        return opt.nama_produk || opt.nama || opt.title || '';
                      }}
                      isOptionEqualToValue={(option, value) => String(option?.id_produk || option?.id) === String(value?.id_produk || value?.id)}
                      value={prod || null}
                      clearOnBlur={false}
                      renderOption={(props, option) => {
                        const price = option?.harga_per_pcs ? `Rp${Number(option.harga_per_pcs).toLocaleString('id-ID')}` : option?.harga_per_m2 ? `Rp${Number(option.harga_per_m2).toLocaleString('id-ID')}` : '-';
                        const satuan = option?.harga_per_pcs ? '/ pcs' : option?.harga_per_m2 ? '/ m2' : '';
                        const name = option?.nama_produk || option?.nama || option || '';
                        const kategori = option?.kategori || '-';
                        const bahan = option?.bahan || '-';
                        const finishing = option?.finishing || '-';
                        const ukuran = option?.ukuran_standar || option?.ukuran || '-';
                        const waktu = option?.waktu_proses || '-';
                        const stock = option?.stock != null ? String(option.stock) : '-';
                        // assemble details joined by bullet
                        const details = [kategori, bahan, finishing, ukuran, waktu, `Stok: ${stock}`].filter(Boolean).join(' • ');
                        return (
                          <Box component="li" {...props} sx={{ py: 1, px: 3, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#eef6ff' }}>{name}</Typography>
                              <Typography sx={{ color: option?.stock === 0 ? '#ffd6a5' : '#9ae6b4', fontWeight: 700, fontSize: 13 }}>{price}<Box component="span" sx={{ color: '#9ca3af', fontWeight: 500 }}> {satuan}</Box></Typography>
                            </Box>

                            <Box sx={{ mt: 1, mb: 1 }}>
                              <Box sx={{ height: 1, bgcolor: 'rgba(148,163,184,0.06)', width: '100%' }} />
                            </Box>

                            <Typography sx={{ mt: 0.5, color: '#9ca3af', fontSize: 12, lineHeight: 1.3 }}>{details}</Typography>
                          </Box>
                        );
                      }}
                      componentsProps={{
                        paper: { sx: { bgcolor: 'rgba(15,23,42,0.98)', color: '#cbd5e1' } },
                        listbox: { sx: { bgcolor: 'rgba(15,23,42,0.98)', color: '#cbd5e1', maxHeight: 320, overflow: 'auto', py: 0 } }
                      }}
                      onChange={(_e, v) => {
                        if (!v) handleLineChange(idx, 'produk_id', null);
                        else handleLineChange(idx, 'produk_id', v?.id_produk || v?.id || null);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={`Pilih Produk — Item ${idx + 1}`}
                          margin="dense"
                          fullWidth
                          sx={inputSx}
                          InputProps={{ ...params.InputProps, sx: { color: '#fff' } }}
                        />
                      )}
                    />

                    {prod && (
                      <Box sx={{ color: '#cbd5e1', fontSize: 13, mt: 1 }}>
                        <Typography sx={{ color: '#ffe066', fontSize: 13, fontWeight: 700 }}>{prod.nama_produk || prod.nama}</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
                          <Box>
                            <Typography sx={{ color: '#ffe066', fontSize: 12, fontWeight: 700 }}>Harga</Typography>
                            <Typography sx={{ color: '#cbd5e1', fontSize: 13 }}>{prod.harga_per_pcs ? `Rp${Number(prod.harga_per_pcs).toLocaleString('id-ID')} / pcs` : prod.harga_per_m2 ? `Rp${Number(prod.harga_per_m2).toLocaleString('id-ID')} / m2` : '-'}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ color: '#ffe066', fontSize: 12, fontWeight: 700 }}>Kategori</Typography>
                            <Typography sx={{ color: '#cbd5e1', fontSize: 13 }}>{prod.kategori || '-'}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ color: '#ffe066', fontSize: 12, fontWeight: 700 }}>Bahan</Typography>
                            <Typography sx={{ color: '#cbd5e1', fontSize: 13 }}>{prod.bahan || '-'}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ color: '#ffe066', fontSize: 12, fontWeight: 700 }}>Finishing</Typography>
                            <Typography sx={{ color: '#cbd5e1', fontSize: 13 }}>{prod.finishing || '-'}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ color: '#ffe066', fontSize: 12, fontWeight: 700 }}>Ukuran</Typography>
                            <Typography sx={{ color: '#cbd5e1', fontSize: 13 }}>{prod.ukuran_standar || prod.ukuran || '-'}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ color: '#ffe066', fontSize: 12, fontWeight: 700 }}>Stock</Typography>
                            <Typography sx={{ color: '#cbd5e1', fontSize: 13 }}>{prod.stock != null ? String(prod.stock) : '-'}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ width: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, alignSelf: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton size="small" onClick={() => decrement(idx)} sx={{ bgcolor: '#1f2937', color: '#fff' }}><RemoveIcon fontSize="small" /></IconButton>
                      <Box sx={{ minWidth: 48, textAlign: 'center', color: '#fff', border: '1px solid #334155', borderRadius: 1, py: '6px' }}>{ln.quantity || 0}</Box>
                      <IconButton size="small" onClick={() => increment(idx)} sx={{ bgcolor: '#1f2937', color: '#fff' }}><AddIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', ml: 'auto' }}>
                    <IconButton aria-label="remove-line" title="Hapus baris" size="small" onClick={() => removeLine(idx)} sx={{ bgcolor: '#ef4444', color: '#fff', '&:hover': { bgcolor: '#dc2626' } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
            <Button sx={{ mt: 1, px: 2, minWidth: 44 }} onClick={addLine} variant="contained" color="primary" startIcon={<AddIcon />} aria-label="Tambah baris produk" />
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ color: '#34d399', fontWeight: 700 }}>Total: Rp{Number(computeTotal()).toLocaleString('id-ID')}</Typography>
            </Box>
          </Box>
        )}

        {step === 'summary' && (
          <Box>
            <Typography sx={{ color: '#60a5fa', fontWeight: 700, mb: 1 }}>Summary</Typography>
            <Box sx={{ color: '#fff', mb: 2 }}>
              <Typography component="div"><strong>Customer:</strong> {selectedCustomer ? (selectedCustomer.nama || selectedCustomer.name) : (form.customer_name || '-')}</Typography>
              <Typography component="div"><strong>Phone:</strong> {selectedCustomer ? (selectedCustomer.phone || selectedCustomer.no_hp) : (form.customer_phone || '-')}</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: '#ffe066', fontWeight: 700, mb: 1 }}>Items</Typography>
              {aggregateLines().length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#f472b6', fontWeight: 700 }}>Product</TableCell>
                      <TableCell sx={{ color: '#34d399', fontWeight: 700 }}>Qty</TableCell>
                      <TableCell sx={{ color: '#a78bfa', fontWeight: 700, textAlign: 'right' }}>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {aggregateLines().map((ag, i) => {
                      const prod = productsList.find((p) => String(p.id_produk || p.id) === String(ag.produk_id));
                      const qty = Number(ag.quantity) || 0;
                      const pricePer = prod?.harga_per_pcs || prod?.harga_per_m2 || 0;
                      const lineTotal = pricePer * qty;
                      return (
                        <TableRow key={i} sx={{ borderBottom: '1px dashed rgba(255,255,255,0.03)' }}>
                          <TableCell sx={{ color: '#fff' }}>{prod ? (prod.nama_produk || prod.nama) : `Produk #${ag.produk_id}`}</TableCell>
                          <TableCell sx={{ color: '#cbd5e1', fontWeight: 700 }}>{qty}</TableCell>
                          <TableCell sx={{ color: '#cbd5e1', textAlign: 'right' }}>Rp{Number(lineTotal).toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Typography sx={{ color: '#60a5fa', fontStyle: 'italic' }}>Tidak ada item.</Typography>
              )}
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ color: '#34d399', fontWeight: 700 }}>Total: Rp{Number(computeTotal()).toLocaleString('id-ID')}</Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {step === 'customer' ? (
              <Button variant="contained" color="primary" onClick={handleCustomerCreate} sx={{ mr: 1, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>Create Customer</Button>
            ) : (
              <Button variant="contained" onClick={handleBack}>Back</Button>
            )}
          </Box>
          <Box>
            {step === 'customer' && (
              <Button variant="outlined" onClick={handleCustomerProceed} disabled={!selectedCustomer && !(form.customer_name || form.customer_phone)} sx={{ ml: 1, color: '#fff', borderColor: '#fff', backgroundColor: 'transparent', '&.Mui-disabled': { color: 'rgba(148,163,184,0.95)', borderColor: 'rgba(148,163,184,0.25)', backgroundColor: 'rgba(148,163,184,0.03)', cursor: 'not-allowed', opacity: 1 } }}>Pilih / Lanjut</Button>
            )}
            {step === 'items' && (
              <Button variant="contained" onClick={() => setStep('summary')} disabled={!itemsValid()} sx={{ '&.Mui-disabled': { backgroundColor: 'rgba(148,163,184,0.06)', color: 'rgba(148,163,184,0.9)', borderColor: 'rgba(148,163,184,0.15)' } }}>Lanjut ke Summary</Button>
            )}
            {step === 'summary' && (
              <Button variant="contained" onClick={handleConfirm}>Konfirmasi & Buat Order</Button>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
