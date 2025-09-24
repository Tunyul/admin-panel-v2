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
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSearchParams } from 'react-router-dom';

import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../api/products';
import useNotificationStore from '../store/notificationStore';
import TableToolbar from '../components/TableToolbar';

const ProductRow = React.memo(function ProductRow({ row, expanded, detailsLoading, detailsMap, onOpen, onDelete, onExpand }) {
  const id = row.id_produk || row.id;
  return (
    <>
      <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
        <TableCell>{id}</TableCell>
        <TableCell>{row.kategori || '-'}</TableCell>
        <TableCell>{row.nama_produk || '-'}</TableCell>
        <TableCell>{row.harga_per_m2 ? `Rp${Number(row.harga_per_m2).toLocaleString('id-ID')}` : '-'}</TableCell>
        <TableCell>{row.harga_per_pcs ? `Rp${Number(row.harga_per_pcs).toLocaleString('id-ID')}` : '-'}</TableCell>
        <TableCell>{row.stock != null ? row.stock : 0}</TableCell>
        <TableCell>
          <IconButton color="primary" onClick={() => onOpen(row)} size="small"><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => onDelete(id)} size="small"><DeleteIcon /></IconButton>
          <IconButton color="info" onClick={() => onExpand(id)} size="small"><InfoIcon /></IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
          <Collapse in={expanded === id} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom>Product Details</Typography>
              {detailsLoading[id] ? (
                <Typography>Loading details...</Typography>
              ) : detailsMap[id] ? (
                <Box>
                  <Typography><strong>Material:</strong> {detailsMap[id].bahan || '-'}</Typography>
                  <Typography><strong>Description:</strong> {detailsMap[id].deskripsi || '-'}</Typography>
                  <Typography><strong>Notes:</strong> {detailsMap[id].catatan || '-'}</Typography>
                </Box>
              ) : (
                <Typography>No additional details available</Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
});

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
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

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '' || value == null) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    setSearchParams(params)
  }

  const reloadProducts = useCallback(() => {
    setLoading(true);
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
      });
  }, []);

  useEffect(() => {
    reloadProducts();
  }, [reloadProducts]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      showNotification('🔄 Refreshing products...', 'info')
      reloadProducts().then(() => {
        showNotification(`✅ ${data.length} products loaded`, 'success')
      }).catch(() => {
        showNotification('❌ Failed to refresh products', 'error')
      })
    }
    
    window.addEventListener('app:refresh:products', handleRefresh)
    return () => window.removeEventListener('app:refresh:products', handleRefresh)
  }, [reloadProducts, data.length, showNotification])

  const searchQuery = searchParams.get('q') || ''
  const categoryFilter = searchParams.get('category') || ''
  
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
    if (!form.nama_produk?.trim()) newErrors.nama_produk = 'Product name is required';
    if (!form.kategori?.trim()) newErrors.kategori = 'Category is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const promise = form.id_produk ? updateProduct(form.id_produk, form) : createProduct(form);
    promise
      .then(() => {
        showNotification(`Product ${form.id_produk ? 'updated' : 'created'} successfully`, 'success');
        handleClose();
        reloadProducts();
      })
      .catch((err) => {
        showNotification(`Failed to ${form.id_produk ? 'update' : 'create'} product`, 'error');
        console.error(err);
      });
  };

  const handleDelete = (id) => setDeleteConfirm({ open: true, id });

  const confirmDelete = () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    if (!id) return;
    
    deleteProduct(id)
      .then(() => {
        showNotification('Product deleted successfully', 'success');
        reloadProducts();
      })
      .catch((err) => {
        showNotification('Failed to delete product', 'error');
        console.error(err);
      });
  };

  const handleExpandWithDetails = useCallback((id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!detailsMap[id] && !detailsLoading[id]) {
      setDetailsLoading((prev) => ({ ...prev, [id]: true }));
      getProductById(id)
        .then((res) => {
          setDetailsMap((prev) => ({ ...prev, [id]: res?.data || res }));
        })
        .catch((err) => {
          console.error(`Failed to load details for product ${id}`, err);
          setDetailsMap((prev) => ({ ...prev, [id]: null }));
        })
        .finally(() => {
          setDetailsLoading((prev) => ({ ...prev, [id]: false }));
        });
    }
  }, [expanded, detailsMap, detailsLoading]);

  // Category filter options
  const categoryFilterOptions = [
    ...new Set(data.map(d => d.kategori))
  ].filter(Boolean).map(c => ({ value: c, label: c }))

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          <TableToolbar
            value={searchQuery}
            onChange={(value) => updateParam('q', value)}
            placeholder="Search products (name, category, material)"
            hideFilters
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            startIcon={<RefreshIcon />} 
            variant="outlined" 
            size="small" 
            onClick={() => window.dispatchEvent(new CustomEvent('app:refresh:products'))}
          >
            Refresh
          </Button>
          <Button 
            startIcon={<AddIcon />} 
            variant="contained" 
            size="small" 
            onClick={() => handleOpen()}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Filters Row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TableToolbar
          hideSearch
          filterValue={categoryFilter}
          onFilterChange={(value) => updateParam('category', value)}
          filterOptions={categoryFilterOptions}
        />
      </Box>

      {/* Products Table */}
      <Box 
        sx={{ 
          maxHeight: 'clamp(40vh, calc(100vh - var(--header-height) - 160px), 75vh)',
          overflow: 'auto',
          overflowX: 'auto'
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>Price/m²</TableCell>
              <TableCell>Price/pcs</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography>
                    {data.length === 0 ? 'No products found' : 'No products match current filters'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
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
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Add/Edit Product Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id_produk ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Product Name"
              name="nama_produk"
              value={form.nama_produk || ''}
              onChange={handleChange}
              error={!!errors.nama_produk}
              helperText={errors.nama_produk}
              fullWidth
            />
            <TextField
              label="Category"
              name="kategori"
              value={form.kategori || ''}
              onChange={handleChange}
              error={!!errors.kategori}
              helperText={errors.kategori}
              fullWidth
            />
            <TextField
              label="Price per m²"
              name="harga_per_m2"
              type="number"
              value={form.harga_per_m2 || ''}
              onChange={handleChange}
              error={!!errors.harga_per_m2}
              helperText={errors.harga_per_m2}
              fullWidth
            />
            <TextField
              label="Price per pcs"
              name="harga_per_pcs"
              type="number"
              value={form.harga_per_pcs || ''}
              onChange={handleChange}
              error={!!errors.harga_per_pcs}
              helperText={errors.harga_per_pcs}
              fullWidth
            />
            <TextField
              label="Material"
              name="bahan"
              value={form.bahan || ''}
              onChange={handleChange}
              error={!!errors.bahan}
              helperText={errors.bahan}
              fullWidth
            />
            <TextField
              label="Stock"
              name="stock"
              type="number"
              value={form.stock || ''}
              onChange={handleChange}
              error={!!errors.stock}
              helperText={errors.stock}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this product?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Products;