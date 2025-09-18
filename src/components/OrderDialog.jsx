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
import useNotificationStore from '../store/notificationStore';
import { createCustomer } from '../api/customers';
import { createOrder as apiCreateOrder, updateOrder } from '../api/orders';
import { createOrderDetail } from '../api/orderDetail';

export default function OrderDialog({ open, onClose, productsList = [], customersList = [], onCreated }) {
  const [step, setStep] = useState('customer');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form, setForm] = useState({});
  const [orderLines, setOrderLines] = useState([]);
  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (open) {
      setStep('customer');
      setSelectedCustomer(null);
      setForm({});
      setOrderLines([{ produk_id: null, quantity: 1 }]);
    }
  }, [open]);

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

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 4, bgcolor: 'rgba(35,41,70,0.98)', width: { xs: '92%', md: '900px' }, maxHeight: '80vh' } }}>
      <DialogTitle sx={{ color: '#ffe066', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          {form.id_order ? 'Edit Order' : 'Add Order'}
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ color: step === 'customer' ? '#fff' : '#888' }}><strong>Step 1</strong></Box>
              <Box sx={{ width: 80, height: 6, bgcolor: step === 'customer' ? '#34d399' : '#333', borderRadius: 2 }} />
              <Box sx={{ color: step === 'items' ? '#fff' : '#888' }}><strong>Step 2</strong></Box>
              <Box sx={{ width: 80, height: 6, bgcolor: step === 'items' ? '#34d399' : '#333', borderRadius: 2 }} />
              <Box sx={{ color: step === 'summary' ? '#fff' : '#888' }}><strong>Step 3</strong></Box>
            </Box>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ overflowY: 'auto', px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
        {step === 'customer' && (
          <Box>
            <Typography sx={{ color: '#60a5fa', fontWeight: 700 }}>Customer</Typography>
            <Autocomplete
              freeSolo
              options={customersList || []}
              getOptionLabel={(o) => (typeof o === 'string' ? o : (o.nama || o.name || o.phone || ''))}
              onChange={(_e, v) => {
                if (!v) { setSelectedCustomer(null); setForm((f) => ({ ...f, customer_name: '', customer_phone: '' })); return; }
                if (typeof v === 'string') { setForm((f) => ({ ...f, customer_name: v })); setSelectedCustomer(null); }
                else { setSelectedCustomer(v); setForm((f) => ({ ...f, customer_name: v.nama || v.name, customer_phone: v.phone || v.no_hp })); }
              }}
              onInputChange={(e, nv, reason) => { setForm((f) => ({ ...f, customer_name: nv })); if (reason === 'clear') { setSelectedCustomer(null); setForm((f) => ({ ...f, customer_name: '', customer_phone: '' })); } }}
              renderInput={(params) => <TextField {...params} label="Cari / ketik nama atau no HP" margin="dense" fullWidth InputProps={{ ...params.InputProps, sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#60a5fa' } }} onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))} />}
            />
          </Box>
        )}

        {step === 'items' && (
          <Box>
            <Typography sx={{ color: '#60a5fa', fontWeight: 700 }}>Items</Typography>
            {orderLines.map((ln, idx) => {
              const prod = productsList.find((p) => String(p.id_produk || p.id) === String(ln.produk_id));
              return (
                <Box key={idx} sx={{ p: 1, mb: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)' }}>
                  <Autocomplete
                    options={productsList || []}
                    getOptionLabel={(opt) => (typeof opt === 'string' ? opt : (opt.nama_produk || opt.nama || ''))}
                    value={prod || null}
                    onChange={(_e, v) => { if (!v) handleLineChange(idx, 'produk_id', null); else handleLineChange(idx, 'produk_id', v?.id_produk || v?.id || null); }}
                    renderInput={(params) => <TextField {...params} label={`Produk #${idx + 1}`} margin="dense" fullWidth InputProps={{ ...params.InputProps, sx: { color: '#fff' } }} />}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <IconButton size="small" onClick={() => decrement(idx)} sx={{ bgcolor: '#1f2937', color: '#fff' }}><RemoveIcon fontSize="small" /></IconButton>
                    <Box sx={{ minWidth: 48, textAlign: 'center', color: '#fff', border: '1px solid #334155', borderRadius: 1, py: '6px' }}>{ln.quantity || 0}</Box>
                    <IconButton size="small" onClick={() => increment(idx)} sx={{ bgcolor: '#1f2937', color: '#fff' }}><AddIcon fontSize="small" /></IconButton>
                    <Button variant="contained" color="error" size="small" onClick={() => removeLine(idx)}>Remove</Button>
                  </Box>

                  {prod && (
                    <Box sx={{ color: '#cbd5e1', fontSize: 13, mt: 1 }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1 }}>
                        <Box>
                          <Typography component="div" sx={{ color: '#ffe066', fontSize: 13, fontWeight: 700 }}>Harga</Typography>
                          <Typography component="div">{prod.harga_per_pcs ? `Rp${Number(prod.harga_per_pcs).toLocaleString('id-ID')} / pcs` : prod.harga_per_m2 ? `Rp${Number(prod.harga_per_m2).toLocaleString('id-ID')} / m2` : '-'}</Typography>
                        </Box>
                        <Box>
                          <Typography component="div" sx={{ color: '#ffe066', fontSize: 13, fontWeight: 700 }}>Kategori</Typography>
                          <Typography component="div">{prod.kategori || '-'}</Typography>
                        </Box>
                        <Box>
                          <Typography component="div" sx={{ color: '#ffe066', fontSize: 13, fontWeight: 700 }}>Bahan</Typography>
                          <Typography component="div">{prod.bahan || '-'}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            })}
            <Button sx={{ mt: 1 }} onClick={addLine} variant="outlined">Add product line</Button>
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
              <Button variant="contained" onClick={() => { setSelectedCustomer(null); setForm((f) => ({ ...f, customer_name: '', customer_phone: '' })); setStep('customer'); }}>Back</Button>
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
