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
  Chip,
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
import { getOrders, createOrder, updateOrder, deleteOrder } from '../api/orders';
import { getOrderDetailsByOrderId } from '../api/orderDetail';
import useNotificationStore from '../store/notificationStore';
import useLoadingStore from '../store/loadingStore';

const OrderRow = React.memo(function OrderRow({ row, expanded, detailsMap, detailsLoading, onOpen, onDelete, onExpand }) {
  return (
    <>
      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(96,165,250,0.08)' } }}>
        <TableCell sx={{ color: '#fff' }}>{row.no_transaksi || '-'}</TableCell>
        <TableCell sx={{ color: '#fff' }}>{row.customer?.nama || '-'}</TableCell>
        <TableCell sx={{ color: '#ffe066' }}>{row.tanggal_order ? new Date(row.tanggal_order).toLocaleString('id-ID') : '-'}</TableCell>
        <TableCell>
          <Chip label={row.status_urgensi || '-'} size="small" sx={{ bgcolor: row.status_urgensi === 'urgent' ? '#f87171' : '#60a5fa', color: '#fff', fontWeight: 700 }} />
        </TableCell>
        <TableCell sx={{ color: '#34d399', fontWeight: 700 }}>{row.total_bayar ? `Rp${Number(row.total_bayar).toLocaleString('id-ID')}` : '-'}</TableCell>
        <TableCell>
          <Chip label={row.status_bayar || '-'} size="small" sx={{ bgcolor: row.status_bayar === 'lunas' ? '#34d399' : '#fbbf24', color: '#232946', fontWeight: 700 }} />
        </TableCell>
        <TableCell sx={{ color: '#60a5fa' }}>{row.tanggal_jatuh_tempo ? new Date(row.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : '-'}</TableCell>
        <TableCell>
          <Chip label={row.status_order || '-'} size="small" sx={{ bgcolor: row.status_order === 'proses' ? '#60a5fa' : '#a78bfa', color: '#fff', fontWeight: 700 }} />
        </TableCell>
        <TableCell>
          <Chip label={row.status || '-'} size="small" sx={{ bgcolor: row.status === 'pending' ? '#fbbf24' : row.status === 'proses' ? '#60a5fa' : row.status === 'selesai' ? '#34d399' : '#f87171', color: '#232946', fontWeight: 700 }} />
        </TableCell>
        <TableCell>
          <IconButton color="primary" onClick={() => onOpen(row)}><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => onDelete(row.id_order)}><DeleteIcon /></IconButton>
          <IconButton color="info" onClick={() => onExpand(row.id_order)}><InfoIcon /></IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={10} sx={{ p: 0, border: 0, bgcolor: 'transparent' }}>
          <Collapse in={expanded === row.id_order} timeout="auto" unmountOnExit>
            <Box sx={{ bgcolor: 'rgba(35,41,70,0.95)', borderRadius: 2, p: 2, mt: 1, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#60a5fa', fontWeight: 700, mb: 1 }}>Order Details</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#f472b6', fontWeight: 700 }}>Produk</TableCell>
                    <TableCell sx={{ color: '#34d399', fontWeight: 700 }}>Qty</TableCell>
                    <TableCell sx={{ color: '#ffe066', fontWeight: 700 }}>Harga Satuan</TableCell>
                    <TableCell sx={{ color: '#a78bfa', fontWeight: 700 }}>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detailsMap[row.id_order] || row.details || []).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell sx={{ color: '#fff' }}>{d.produk?.nama || '-'}</TableCell>
                      <TableCell sx={{ color: '#34d399', fontWeight: 700 }}>{d.quantity || '-'}</TableCell>
                      <TableCell sx={{ color: '#ffe066' }}>{d.harga_satuan ? `Rp${Number(d.harga_satuan).toLocaleString('id-ID')}` : '-'}</TableCell>
                      <TableCell sx={{ color: '#a78bfa' }}>{d.subtotal_item ? `Rp${Number(d.subtotal_item).toLocaleString('id-ID')}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                  {detailsLoading[row.id_order] && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: '#60a5fa', fontStyle: 'italic' }}>
                        Loading details...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {row.catatan && (
                <Typography variant="body2" sx={{ color: '#fbbf24', mt: 2 }}>
                  Catatan: {row.catatan}
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
});

function Orders() {
  const [data, setData] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});
  const [detailsLoading, setDetailsLoading] = useState({});
  const { showNotification } = useNotificationStore();

  const reloadOrders = useCallback(() => {
    setLoading(true);
    useLoadingStore.getState().start();
    return getOrders()
      .then((res) => {
        const orders = res?.data?.data || res?.data || [];
        setData(Array.isArray(orders) ? orders : []);
        setError(null);
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setData([]);
          setError('Data order tidak ditemukan.');
        } else {
          setError('Gagal memuat data orders');
        }
      })
      .finally(() => {
        setLoading(false);
        useLoadingStore.getState().done();
      });
  }, []);

  useEffect(() => {
    reloadOrders();
  }, [reloadOrders]);
  const handleOpen = useCallback((item = {}) => { setForm(item); setOpen(true); }, []);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleChange = useCallback((e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value })), []);
  const handleSave = () => {
    const payload = { ...form };
    const op = form.id_order ? updateOrder(form.id_order, payload) : createOrder(payload);
    op
      .then(() => {
        showNotification('Saved', 'success');
        handleClose();
        // refresh list
        reloadOrders();
      })
      .catch(() => {
        showNotification('Gagal menyimpan order', 'error');
      });
  };
  const handleDelete = useCallback((id_order) => {
    deleteOrder(id_order)
      .then(() => {
        showNotification('Order deleted', 'info');
        reloadOrders();
      })
      .catch(() => {
        showNotification('Gagal menghapus order', 'error');
      });
  }, [reloadOrders, showNotification]);
  // expansion handled via handleExpandWithDetails

  const handleExpandWithDetails = useCallback((id_order) => {
    const willExpand = (expanded) => (expanded !== id_order);
    setExpanded((prev) => (prev !== id_order ? id_order : null));
    if (!detailsMap[id_order]) {
      setDetailsLoading((s) => ({ ...s, [id_order]: true }));
      getOrderDetailsByOrderId(id_order)
        .then((res) => {
          const details = res?.data?.data || res?.data || [];
          setDetailsMap((s) => ({ ...s, [id_order]: Array.isArray(details) ? details : [] }));
        })
        .catch(() => {
          setDetailsMap((s) => ({ ...s, [id_order]: [] }));
          showNotification('Gagal memuat detail order', 'error');
        })
        .finally(() => setDetailsLoading((s) => ({ ...s, [id_order]: false })));
    }
  }, [detailsMap, showNotification]);

  // Show loading while initial data is being fetched. Keep this after hooks.
  if (_loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  return (
  <Box className="main-card" sx={{ bgcolor: 'rgba(35,41,70,0.98)', borderRadius: 4, boxShadow: '0 0 24px #fbbf2433', p: { xs: 2, md: 2 }, width: '100%', mt: { xs: 2, md: 4 }, fontFamily: 'Poppins, Inter, Arial, sans-serif' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: '#ffe066', letterSpacing: 1 }}>
          Orders
        </Typography>
        <Button variant="contained" sx={{ bgcolor: '#ffe066', color: '#232946', fontWeight: 700, borderRadius: 3, boxShadow: '0 0 8px #ffe06655', '&:hover': { bgcolor: '#ffd60a' }, textTransform: 'none' }} onClick={() => handleOpen()}>
          Add Order
        </Button>
      </Box>

      {_error && (
        <Box sx={{ color: 'orange', mb: 2 }}>{_error}</Box>
      )}

      <Paper elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none', width: '100%' }}>
        <Box className="table-responsive" sx={{ width: '100%', overflowX: 'auto' }}>
          <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(35,41,70,0.95)' }}>
              <TableCell sx={{ color: '#60a5fa', fontWeight: 700 }}>No Transaksi</TableCell>
              <TableCell sx={{ color: '#f472b6', fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ color: '#ffe066', fontWeight: 700 }}>Tanggal Order</TableCell>
              <TableCell sx={{ color: '#a78bfa', fontWeight: 700 }}>Status Urgensi</TableCell>
              <TableCell sx={{ color: '#34d399', fontWeight: 700 }}>Total Bayar</TableCell>
              <TableCell sx={{ color: '#fbbf24', fontWeight: 700 }}>Status Bayar</TableCell>
              <TableCell sx={{ color: '#60a5fa', fontWeight: 700 }}>Jatuh Tempo</TableCell>
              <TableCell sx={{ color: '#f472b6', fontWeight: 700 }}>Status Order</TableCell>
              <TableCell sx={{ color: '#a78bfa', fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Aksi</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data && data.length > 0 ? (
              data.map((row) => (
                <OrderRow
                  key={row.id_order}
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
                <TableCell colSpan={10} align="center" sx={{ color: '#60a5fa', fontStyle: 'italic' }}>
                  Belum ada data order.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </Box>
        <Box className="table-bottom-space" />
      </Paper>
      <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 4, bgcolor: 'rgba(35,41,70,0.98)' } }}>
        <DialogTitle sx={{ color: '#ffe066', fontWeight: 700, fontFamily: 'Poppins, Inter, Arial, sans-serif' }}>{form.id_order ? 'Edit Order' : 'Add Order'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="no_transaksi" label="No Transaksi" type="text" fullWidth value={form.no_transaksi || ''} onChange={handleChange} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#ffe066' } }} />
          <TextField margin="dense" name="customer" label="Customer" type="text" fullWidth value={form.customer?.nama || ''} onChange={handleChange} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#60a5fa' } }} />
          <TextField margin="dense" name="total_bayar" label="Total Bayar" type="number" fullWidth value={form.total_bayar || ''} onChange={handleChange} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#f472b6' } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: '#fff', fontFamily: 'Poppins, Inter, Arial, sans-serif' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#ffe066', color: '#232946', fontWeight: 700, borderRadius: 3, fontFamily: 'Poppins, Inter, Arial, sans-serif', '&:hover': { bgcolor: '#ffd60a', color: '#232946' } }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Orders;

