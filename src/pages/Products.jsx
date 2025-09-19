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

import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../api/products';
import useLoadingStore from '../store/loadingStore';
import useNotificationStore from '../store/notificationStore';
import TableToolbar from '../components/TableToolbar';

const ProductRow = React.memo(function ProductRow({ row, expanded, detailsLoading, detailsMap, onOpen, onDelete, onExpand }) {
  const id = row.id_produk || row.id;
  return (
    <>
      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(96,165,250,0.08)' } }}>
        <TableCell sx={{ color: '#fff' }}>{id}</TableCell>
        <TableCell sx={{ color: '#f8fafc' }}>{row.kategori || '-'}</TableCell>
        <TableCell sx={{ color: '#fff' }}>{row.nama_produk || '-'}</TableCell>
        <TableCell sx={{ color: '#34d399' }}>{row.harga_per_m2 ? `Rp${Number(row.harga_per_m2).toLocaleString('id-ID')}` : '-'}</TableCell>
        <TableCell sx={{ color: '#ffe066' }}>{row.harga_per_pcs ? `Rp${Number(row.harga_per_pcs).toLocaleString('id-ID')}` : '-'}</TableCell>
        <TableCell sx={{ color: '#fff' }}>{row.stock != null ? row.stock : 0}</TableCell>
        <TableCell>
          <IconButton color="primary" onClick={() => onOpen(row)}><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => onDelete(id)}><DeleteIcon /></IconButton>
          <IconButton color="info" onClick={() => onExpand(id)}><InfoIcon /></IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0, bgcolor: 'transparent' }}>
          <Collapse in={expanded === id} timeout="auto" unmountOnExit>
            <Box sx={{ bgcolor: 'rgba(35,41,70,0.95)', borderRadius: 2, p: 2, mt: 1, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#60a5fa', fontWeight: 700, mb: 1 }}>Product Details</Typography>
              {detailsLoading[id] ? (
                <Typography sx={{ color: '#60a5fa', fontStyle: 'italic' }}>Loading details...</Typography>
              ) : (
                <Box sx={{ color: '#fff' }}>
                  <Typography><strong>Bahan:</strong> {detailsMap[id]?.bahan || row.bahan || '-'}</Typography>
                  <Typography><strong>Finishing:</strong> {detailsMap[id]?.finishing || row.finishing || '-'}</Typography>
                  <Typography><strong>Ukuran Standar:</strong> {detailsMap[id]?.ukuran_standar || row.ukuran_standar || '-'}</Typography>
                  <Typography><strong>Waktu Proses:</strong> {detailsMap[id]?.waktu_proses || row.waktu_proses || '-'}</Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
});

function Products() {
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

  const reloadProducts = useCallback(() => {
    setLoading(true);
    // increment global busy counter so route loader knows work is ongoing
    useLoadingStore.getState().start();
    return getProducts()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setData(Array.isArray(items) ? items : []);
        setError(null);
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setData([]);
          setError('Data produk tidak ditemukan.');
        } else {
          setError('Gagal memuat data products');
        }
      })
      .finally(() => {
        setLoading(false);
        // mark global work done
        useLoadingStore.getState().done();
      });
  }, []);

  useEffect(() => {
    reloadProducts();
  }, [reloadProducts]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const filteredData = data.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const hay = `${row.nama_produk || ''} ${row.kategori || ''} ${row.bahan || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (categoryFilter) {
      if ((row.kategori || '').toString() !== categoryFilter) return false;
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
    if (!form.kategori || !form.kategori.trim()) newErrors.kategori = 'Kategori wajib diisi';
    if (!form.nama_produk || !form.nama_produk.trim()) newErrors.nama_produk = 'Nama produk wajib diisi';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    const payload = {
      kategori: form.kategori,
      nama_produk: form.nama_produk,
      bahan: form.bahan || null,
      finishing: form.finishing || null,
      ukuran_standar: form.ukuran_standar || null,
      harga_per_m2: form.harga_per_m2 || null,
      harga_per_pcs: form.harga_per_pcs || null,
      waktu_proses: form.waktu_proses || null,
      stock: form.stock != null ? Number(form.stock) : 0,
    };
    const op = form.id_produk ? updateProduct(form.id_produk, payload) : createProduct(payload);
    op
      .then(() => {
        showNotification('Saved product', 'success');
        handleClose();
        reloadProducts();
      })
      .catch(() => showNotification('Gagal menyimpan product', 'error'));
  };

  const handleDelete = useCallback((id) => setDeleteConfirm({ open: true, id }), []);
  const confirmDelete = () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    if (!id) return;
    deleteProduct(id)
      .then(() => {
        showNotification('Product deleted', 'info');
        reloadProducts();
      })
      .catch(() => showNotification('Gagal menghapus product', 'error'));
  };
  const cancelDelete = () => setDeleteConfirm({ open: false, id: null });

  const handleExpandWithDetails = useCallback((id) => {
  const _willExpand = (expanded) => (expanded !== id);
  setExpanded((prev) => (prev !== id ? id : null));
    if (!detailsMap[id]) {
      setDetailsLoading((s) => ({ ...s, [id]: true }));
      useLoadingStore.getState().start();
      getProductById(id)
        .then((res) => {
          const details = res?.data?.data || res?.data || {};
          setDetailsMap((s) => ({ ...s, [id]: details }));
        })
        .catch(() => {
          setDetailsMap((s) => ({ ...s, [id]: {} }));
          showNotification('Gagal memuat detail product', 'error');
        })
        .finally(() => {
          setDetailsLoading((s) => ({ ...s, [id]: false }));
          useLoadingStore.getState().done();
        });
    }
  }, [detailsMap, showNotification]);

  // Show a loading spinner while initial load is happening.
  // This must be after all hooks to preserve hook order between renders.
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
          Products
        </Typography>
  <Button variant="contained" sx={{ bgcolor: '#ffe066', color: 'var(--button-text)', fontWeight: 700, borderRadius: 3, textTransform: 'none' }} onClick={() => handleOpen()}>
          Add Product
        </Button>
      </Box>

      <Paper elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none', width: '100%' }}>
        <Box className="table-responsive" sx={{ width: '100%', overflowX: 'auto' }}>
          <TableToolbar value={searchQuery} onChange={setSearchQuery} placeholder="Search products" filterValue={categoryFilter} onFilterChange={setCategoryFilter} filterOptions={[...new Set(data.map(d => d.kategori)).values()].filter(Boolean).map(c => ({ value: c, label: c }))} />
          <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(35,41,70,0.95)' }}>
              <TableCell sx={{ color: '#60a5fa', fontWeight: 700 }}>ID</TableCell>
              <TableCell sx={{ color: '#f472b6', fontWeight: 700 }}>Kategori</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Nama Produk</TableCell>
              <TableCell sx={{ color: '#34d399', fontWeight: 700 }}>Harga/m2</TableCell>
              <TableCell sx={{ color: '#ffe066', fontWeight: 700 }}>Harga/pcs</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Stock</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((row) => (
                <ProductRow
                  key={row.id_produk || row.id}
                  row={row}
                  expanded={expanded}
                  detailsLoading={detailsLoading}
                  detailsMap={detailsMap}
                  onOpen={handleOpen}
                  onDelete={handleDelete}
                  onExpand={handleExpandWithDetails}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: '#60a5fa', fontStyle: 'italic' }}>
                  Belum ada data produk.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </Box>
        <Box className="table-bottom-space" />
      </Paper>

      <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 4, bgcolor: 'rgba(35,41,70,0.98)' } }}>
        <DialogTitle sx={{ color: '#ffe066', fontWeight: 700 }}>{form.id_produk ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="kategori" label="Kategori" type="text" fullWidth value={form.kategori || ''} onChange={handleChange} error={!!errors.kategori} helperText={errors.kategori || ''} />
          <TextField margin="dense" name="nama_produk" label="Nama Produk" type="text" fullWidth value={form.nama_produk || ''} onChange={handleChange} error={!!errors.nama_produk} helperText={errors.nama_produk || ''} />
          <TextField margin="dense" name="bahan" label="Bahan" type="text" fullWidth value={form.bahan || ''} onChange={handleChange} />
          <TextField margin="dense" name="finishing" label="Finishing" type="text" fullWidth value={form.finishing || ''} onChange={handleChange} />
          <TextField margin="dense" name="ukuran_standar" label="Ukuran Standar" type="text" fullWidth value={form.ukuran_standar || ''} onChange={handleChange} />
          <TextField margin="dense" name="harga_per_m2" label="Harga per m2" type="number" fullWidth value={form.harga_per_m2 || ''} onChange={handleChange} />
          <TextField margin="dense" name="harga_per_pcs" label="Harga per pcs" type="number" fullWidth value={form.harga_per_pcs || ''} onChange={handleChange} />
          <TextField margin="dense" name="waktu_proses" label="Waktu Proses" type="text" fullWidth value={form.waktu_proses || ''} onChange={handleChange} />
          <TextField margin="dense" name="stock" label="Stock" type="number" fullWidth value={form.stock != null ? form.stock : ''} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: '#fff' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#ffe066', color: 'var(--button-text)', fontWeight: 700, borderRadius: 3 }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm.open} onClose={cancelDelete} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>Hapus product</DialogTitle>
        <DialogContent>
          <Typography>Yakin ingin menghapus product ini?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Batal</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Hapus</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Products;
