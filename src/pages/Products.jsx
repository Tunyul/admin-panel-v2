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

import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../api/products';
import useLoadingStore from '../store/loadingStore';
import useNotificationStore from '../store/notificationStore';
import TableToolbar from '../components/TableToolbar';

const ProductRow = React.memo(function ProductRow({ row, expanded, detailsLoading, detailsMap, onOpen, onDelete, onExpand }) {
  const id = row.id_produk || row.id;
  return (
    <>
  <TableRow sx={{ '&:hover': { bgcolor: 'rgba(var(--accent-rgb),0.06)' } }}>
    <TableCell sx={{ color: 'var(--text)' }}>{id}</TableCell>
    <TableCell sx={{ color: 'var(--text)' }}>{row.kategori || '-'}</TableCell>
    <TableCell sx={{ color: 'var(--text)' }}>{row.nama_produk || '-'}</TableCell>
    <TableCell sx={{ color: 'var(--accent)' }}>{row.harga_per_m2 ? `Rp${Number(row.harga_per_m2).toLocaleString('id-ID')}` : '-'}</TableCell>
    <TableCell sx={{ color: 'var(--accent-2)' }}>{row.harga_per_pcs ? `Rp${Number(row.harga_per_pcs).toLocaleString('id-ID')}` : '-'}</TableCell>
    <TableCell sx={{ color: 'var(--text)' }}>{row.stock != null ? row.stock : 0}</TableCell>
        <TableCell>
          <IconButton color="primary" onClick={() => onOpen(row)}><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => onDelete(id)}><DeleteIcon /></IconButton>
          <IconButton color="info" onClick={() => onExpand(id)}><InfoIcon /></IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0, bgcolor: 'transparent' }}>
          <Collapse in={expanded === id} timeout="auto" unmountOnExit>
            <Box sx={{ bgcolor: 'var(--main-card-bg)', borderRadius: 2, p: 2, mt: 1, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: 'var(--accent-2)', fontWeight: 700, mb: 1 }}>Product Details</Typography>
              {detailsLoading[id] ? (
                <Typography sx={{ color: 'var(--accent-2)', fontStyle: 'italic' }}>Loading details...</Typography>
              ) : (
                <Box sx={{ color: 'var(--text)' }}>
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

// reuse same modal scrollbar style as Orders for consistent look
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

  // Loading early-return removed — always render page; _loading only disables actions where used.

  return (
  <Box className="main-card" sx={{ bgcolor: 'var(--main-card-bg)', borderRadius: 4, boxShadow: '0 0 24px #fbbf2433', px: { xs: 2, md: 2 }, pt: { xs: 1.5, md: 2 }, width: '100%', mt: { xs: 2, md: 4 }, fontFamily: 'Poppins, Inter, Arial, sans-serif' }}>
    <style>{scrollbarStyle}</style>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#ffe066', letterSpacing: 1, mt: 0 }}>
            Products
          </Typography>
              {/* Desktop/tablet: toolbar inline next to title */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableToolbar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search products"
                  filterValue={categoryFilter}
                  onFilterChange={setCategoryFilter}
                  filterOptions={[...new Set(data.map(d => d.kategori)).values()].filter(Boolean).map(c => ({ value: c, label: c }))}
                  noWrap={true}
                />
              </Box>
            </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="contained" sx={{ bgcolor: '#ffe066', color: 'var(--button-text)', fontWeight: 700, borderRadius: 3, boxShadow: '0 0 8px #ffe06655', '&:hover': { bgcolor: '#ffd60a' }, textTransform: 'none' }} onClick={() => handleOpen()}>
            Add Product
          </Button>
        </Box>
          </Box>

      <Paper elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none', width: '100%' }}>
        {/* mimic Orders layout: fixed-height scroll area with inner modal-scroll for consistent scrollbar and sticky header */}
        <Box sx={{ width: '100%', height: { xs: 520, md: 720 }, borderRadius: 0, p: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'hidden', minHeight: 0 }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'hidden', pt: 0, px: 0, pb: 2, minHeight: 0 }}>
            {/* Small screens: show toolbar below header */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2, px: 2 }}>
              <TableToolbar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search products"
                filterValue={categoryFilter}
                onFilterChange={setCategoryFilter}
                filterOptions={[...new Set(data.map(d => d.kategori)).values()].filter(Boolean).map(c => ({ value: c, label: c }))}
              />
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
              {/* toolbar moved to header (desktop) and small-screen fallback above */}
              {/* single table with colgroup and fixed layout for header/body alignment */}
              <Table sx={{ tableLayout: 'fixed', minWidth: { xs: 800, md: 1400 }, width: 'max-content', '& .MuiTableCell-root': { boxSizing: 'border-box', padding: '0.75rem 0.75rem' }, '& .MuiTableCell-root:last-child': { paddingRight: 0 } }}>
                <colgroup>
                  {/* ID, Kategori, Nama Produk, Harga/m2, Harga/pcs, Stock, Aksi */}
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '220px' }} />
                  <col style={{ width: '520px' }} />
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '140px' }} />
                </colgroup>
                <TableHead sx={{ position: 'sticky', top: 0, zIndex: 1200, background: 'var(--main-card-bg)' }}>
                  <TableRow sx={{ bgcolor: 'transparent' }}>
                    <TableCell sx={{ color: 'var(--accent-2)', fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ color: 'var(--accent-2)', fontWeight: 700 }}>Kategori</TableCell>
                    <TableCell sx={{ color: 'var(--text)', fontWeight: 700 }}>Nama Produk</TableCell>
                    <TableCell sx={{ color: 'var(--accent)', fontWeight: 700 }}>Harga/m2</TableCell>
                    <TableCell sx={{ color: 'var(--accent-2)', fontWeight: 700 }}>Harga/pcs</TableCell>
                    <TableCell sx={{ color: 'var(--text)', fontWeight: 700 }}>Stock</TableCell>
                    <TableCell sx={{ color: 'var(--text)', fontWeight: 700 }}>Aksi</TableCell>
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
                      <TableCell colSpan={7} align="center" sx={{ color: 'var(--accent-2)', fontStyle: 'italic' }}>
                        Belum ada data produk.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 4, bgcolor: 'var(--panel)' } }}>
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
          <Button onClick={handleClose} sx={{ color: 'var(--text)' }}>Cancel</Button>
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
