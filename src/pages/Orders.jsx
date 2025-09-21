import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Autocomplete,
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
  LinearProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { getOrders, createOrder, updateOrder, deleteOrder } from '../api/orders';
import { getOrderDetailsByOrderId, createOrderDetail } from '../api/orderDetail';
import { getProducts } from '../api/products';
import { getCustomers, createCustomer, getCustomerById, getCustomersByPhone } from '../api/customers';
import OrdersTable from '../components/OrdersTable';
import { getPaymentsByTransaksi } from '../api/payments';
import TableToolbar from '../components/TableToolbar';
import OrderDialog from '../components/OrderDialog';
import useNotificationStore from '../store/notificationStore';
import useLoadingStore from '../store/loadingStore';
import useSocket from '../hooks/useSocket';

// Reuse same custom scrollbar style used in Dashboard so modals match theme
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

// ...inline OrderRow moved to components/OrdersTable.jsx

function Orders() {
  const [data, setData] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editingOrder, setEditingOrder] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [customersMap, setCustomersMap] = useState({});
  const [orderLines, setOrderLines] = useState([]);
  const [step, setStep] = useState('customer'); // 'customer' | 'items' | 'summary'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});
  const [detailsLoading, setDetailsLoading] = useState({});
  const [ordersProgress, setOrdersProgress] = useState({ done: 0, total: 0 });
  const { showNotification } = useNotificationStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  // Generate invoice link modal state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState(null);
  const [invoiceResult, setInvoiceResult] = useState(null);

  const handleOpen = useCallback((item = {}) => { setForm(item || {}); setEditingOrder(item || null); setDialogOpen(true); }, []);
  const handleDialogClose = useCallback(() => { setDialogOpen(false); setForm({}); setEditingOrder(null); }, []);

  // keep refs to mutable state we want to read inside callbacks without adding them to deps
  const customersMapRef = useRef(customersMap);
  useEffect(() => { customersMapRef.current = customersMap; }, [customersMap]);

  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  const reloadOrders = useCallback(() => {
    setLoading(true);
    // reset progress immediately to avoid showing previous run's completion while new data loads
    setOrdersProgress({ done: 0, total: 0 });
    useLoadingStore.getState().start();
  return getOrders()
  .then(async (res) => {
        // helpful debug in development: show raw response to help map shapes
        if (import.meta.env.DEV) {
          console.debug('[reloadOrders] response:', res);
        }
        // accept several common shapes: { data: [...] } or { data: { data: [...] } } or { orders: [...] }
        const maybe = res && res.data ? (res.data.data || res.data.orders || res.data.items || res.data) : null;
        const orders = Array.isArray(maybe) ? maybe : (Array.isArray(res?.data) ? res.data : []);
        // enrich orders with payment sums (verified) by transaksi if available
        const enriched = Array.isArray(orders) ? orders : [];
        try {
          // build fetch tasks for orders that have no_transaksi and track progress
          const totalTasks = Array.isArray(enriched) ? enriched.length : 0;
          setOrdersProgress({ done: 0, total: totalTasks });
          const tasks = enriched.map((o) => {
            const tx = o.no_transaksi || o.no_transaksi_lama || '';
            if (!tx) return Promise.resolve({ o, payments: [] });
            return getPaymentsByTransaksi(tx)
              .then((r) => {
                const items = r?.data?.data || r?.data || [];
                return { o, payments: Array.isArray(items) ? items : [] };
              })
              .catch(() => ({ o, payments: [] }));
          });
          // wrap promises to update progress when each resolves
          let completed = 0;
          const wrapped = tasks.map((p) => p.then((res) => {
            completed += 1;
            setOrdersProgress({ done: completed, total: totalTasks });
            return res;
          }).catch((e) => {
            completed += 1;
            setOrdersProgress({ done: completed, total: totalTasks });
            return { o: null, payments: [] };
          }));
          const results = await Promise.all(wrapped);
          // attach computed paid totals
          results.forEach(({ o, payments }) => {
            if (!o) return;
            const verifiedPayments = (payments || []).filter((p) => p.verified || p.status === 'verified' || p.is_verified);
            const paidTotal = verifiedPayments.reduce((s, p) => s + (Number(p.nominal || p.amount || p.jumlah || 0) || 0), 0);
            o.paid_amount = paidTotal;
            o.paid_verified_total = paidTotal;
          });
          // ensure progress shows complete
          setOrdersProgress((s) => ({ ...s, done: s.total }));
        } catch {
          // ignore enrichment errors
        }
        setData(enriched);
        setError(null);
            // fetch customers for orders which only contain id_customer
            try {
              const arr = Array.isArray(orders) ? orders : [];
              const ids = Array.from(new Set(arr.map((o) => o.id_customer).filter(Boolean)));
              ids.forEach((id) => {
                // if we don't have the customer cached, try to fetch it
                if (customersMapRef.current[id]) return;
                try {
                  getCustomerById(id)
                    .then((res) => {
                      const c = res?.data?.data || res?.data || null;
                      if (c) setCustomersMap((m) => ({ ...m, [id]: c }));
                    })
                    .catch(() => {});
                } catch {
                  // ignore per-customer fetch errors
                }
              });
            } catch {
              // ignore
            }
          })
          .catch((err) => {
                  // Provide more helpful error message for debugging
                  console.error('[reloadOrders] failed to load orders', err);
                  let msg = 'Failed to load orders';
                  try {
                    if (err && err.response) {
                      const status = err.response.status;
                      const data = err.response.data;
                      msg = `Failed to load orders: ${status} ${typeof data === 'string' ? data : JSON.stringify(data)}`;
                    } else if (err && err.message) {
                      msg = `Failed to load orders: ${err.message}`;
                    }
                  } catch (e) {
                    // ignore
                  }
                  setError(msg);
                })
          .finally(() => {
            setLoading(false);
            useLoadingStore.getState().done();
          });
  }, [showNotification]);

  useEffect(() => {
    // intentionally not including stable callbacks in deps; these are safe here
     
    getProducts()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setProductsList(Array.isArray(items) ? items : []);
      })
      .catch(() => setProductsList([]));
    getCustomers()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setCustomersList(Array.isArray(items) ? items : []);
      })
      .catch(() => setCustomersList([]));
  }, [showNotification]);

  // load orders when the page mounts (same pattern as other list pages)
  useEffect(() => {
    reloadOrders();
  }, [reloadOrders]);

  // Auto-refresh when server emits order events (created/updated/status changes)
  useEffect(() => {
    // only attach listeners if socket manager is active (connect handled by SocketProvider)
    // We'll listen to window custom events emitted by the socket hook to avoid coupling directly
    // to the socket instance here.
    let timeout = null;
    const scheduleReload = () => {
      // debounce multiple quick events into a single reload
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        try { reloadOrders(); } catch { /* ignore */ }
        timeout = null;
      }, 800);
    };

    const handler = (ev) => {
      try {
        const t = ev?.detail?.type || ev?.detail?.event || ev?.detail?.type || null;
        // Only refresh for order-related events
        if (!t) return scheduleReload();
        if (/order\./i.test(t) || /order/i.test(String(t))) scheduleReload();
      } catch (e) {
        scheduleReload();
      }
    };

    window.addEventListener('app:socket:event', handler);
    // also listen to custom order events that server might emit directly as global events
    window.addEventListener('order.created', scheduleReload);
    window.addEventListener('order.updated', scheduleReload);

    return () => {
      window.removeEventListener('app:socket:event', handler);
      window.removeEventListener('order.created', scheduleReload);
      window.removeEventListener('order.updated', scheduleReload);
      if (timeout) clearTimeout(timeout);
    };
  }, [reloadOrders]);

  // expose a global programmatic refresh helper for scripts or debug tools
  useEffect(() => {
    window.refreshOrders = () => reloadOrders();
    return () => {
      try { delete window.refreshOrders; } catch (_) { window.refreshOrders = undefined; }
    };
  }, [reloadOrders]);

  // table search / filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusBayarFilter, setStatusBayarFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState(null);
  const [totalMinFilter, setTotalMinFilter] = useState('');
  const [totalMaxFilter, setTotalMaxFilter] = useState('');
  const filteredData = data.filter((row) => {
    if (!row) return false;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const hay = `${row.no_transaksi || ''} ${row.nama_customer || row.customer_name || ''} ${row.id_order || ''} ${row.catatan || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (statusFilter) {
      if ((row.status || '').toString() !== statusFilter) return false;
    }
    if (statusBayarFilter) {
      if ((row.status_bayar || '').toString() !== statusBayarFilter) return false;
    }
    if (customerFilter) {
      // If the filter is a primitive (string/number) try to treat it as an ID first (user pasted/typed id)
      if (typeof customerFilter === 'string' || typeof customerFilter === 'number') {
        const fid = String(customerFilter).trim();
        const orderCid = String(row.id_customer || row.customer?.id || row.customer_id || '').trim();
        // if both sides have an id-like value, prefer strict id comparison
        if (orderCid) {
          if (orderCid !== fid) return false;
        } else {
          // fallback to name/phone substring match when order has no explicit customer id
          const s = fid.toLowerCase();
          const target = `${row.customer?.nama || row.nama_customer || row.customer?.name || ''} ${row.customer?.phone || row.customer?.no_hp || ''}`.toLowerCase();
          if (!target.includes(s)) return false;
        }
      } else if (typeof customerFilter === 'object') {
        // normalize candidate id from the selected object
        const cid = customerFilter.id_customer || customerFilter.id || customerFilter.customer_id || null;
        const orderCid = row.id_customer || row.customer?.id || row.customer_id || '';
        if (cid && String(orderCid) !== String(cid)) return false;
        // also allow matching by customer name if an object with name provided
        if (customerFilter.nama && !((row.customer?.nama || row.nama_customer || row.customer?.name || '').toString().toLowerCase().includes((customerFilter.nama || customerFilter.name || '').toString().toLowerCase()))) return false;
        // also match by phone if provided
        if ((customerFilter.phone || customerFilter.no_hp) && !((row.customer?.phone || row.customer?.no_hp || row.phone || '').toString().toLowerCase().includes((customerFilter.phone || customerFilter.no_hp || '').toString().toLowerCase()))) return false;
      }
    }
    if (totalMinFilter) {
      const min = Number(totalMinFilter) || 0;
      const total = Number(row.total_bayar || row.total_tagihan || 0) || 0;
      if (total < min) return false;
    }
    if (totalMaxFilter) {
      const max = Number(totalMaxFilter) || 0;
      const total = Number(row.total_bayar || row.total_tagihan || 0) || 0;
      if (total > max) return false;
    }
    return true;
  });

  useEffect(() => {
    // when opening add dialog, initialize order lines if creating
    if (open && !formRef.current.id_order) setOrderLines([{ produk_id: null, quantity: 1 }]);
  }, [open]);
  const handleClose = useCallback(() => setOpen(false), []);
  const _handleChange = useCallback((e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value })), []);
  const _handleLineChange = (index, key, value) => {
    setOrderLines((lines) => {
      const copy = [...lines];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };
  const _addLine = () => setOrderLines((l) => ([...l, { produk_id: null, quantity: 1 }]));
  const _removeLine = (index) => setOrderLines((l) => l.filter((_, i) => i !== index));
  const _incrementQuantity = (index) => setOrderLines((lines) => {
    const copy = [...lines];
    copy[index] = { ...copy[index], quantity: (Number(copy[index].quantity) || 0) + 1 };
    return copy;
  });
  const _decrementQuantity = (index) => setOrderLines((lines) => {
    const copy = [...lines];
    const newQty = (Number(copy[index].quantity) || 0) - 1;
    copy[index] = { ...copy[index], quantity: newQty > 0 ? newQty : 0 };
    return copy;
  });
  const computeLineSubtotal = (line) => {
    const prod = productsList.find((p) => p.id_produk === Number(line.produk_id) || p.id === Number(line.produk_id));
    const harga = prod?.harga_per_pcs || prod?.harga_per_m2 || 0;
    const qty = Number(line.quantity) || 0;
    return harga * qty;
  };
  const computeTotal = () => orderLines.reduce((s, l) => s + computeLineSubtotal(l), 0);
  const _formatCurrency = (v) => {
    const n = Number(v) || 0;
    return `Rp${n.toLocaleString('id-ID')}`;
  };

  // Aggregate order lines by produk_id for a cleaner summary (merge duplicates)
  const _aggregateLines = () => {
    const map = {};
    for (const l of orderLines) {
      const pid = String(l.produk_id || '');
      if (!pid) continue;
      const qty = Number(l.quantity) || 0;
      if (!map[pid]) map[pid] = { produk_id: pid, quantity: qty };
      else map[pid].quantity = (Number(map[pid].quantity) || 0) + qty;
    }
    return Object.values(map);
  };
  // customer search: try local then backend by phone
  const searchCustomer = (name, phone) => {
    // first local search
    let found = null;
    if (phone) {
      const p = customersList.find((c) => (c.phone === phone || c.no_hp === phone));
      if (p) found = p;
    }
    if (!found && name) {
      const p2 = customersList.find((c) => (String(c.nama || c.name).toLowerCase() === String(name).toLowerCase()));
      if (p2) found = p2;
    }
    if (found) return Promise.resolve(found);
    // fallback to backend phone search if phone provided
    if (phone) {
      return getCustomersByPhone(phone).then((res) => {
        const items = res?.data?.data || res?.data || [];
        if (Array.isArray(items) && items.length) return items[0];
        return null;
      }).catch(() => null);
    }
    return Promise.resolve(null);
  };

  // create order + details (final confirmation)
  const _handleConfirm = () => {
    if (!selectedCustomer && !form.customer_name) {
      showNotification('Pilih atau buat customer terlebih dahulu', 'error');
      return;
    }
    const customer = selectedCustomer || form.customer;
    const customerId = customer?.id_customer || customer?.id || null;
    if (!customerId) {
      showNotification('Customer belum valid', 'error');
      return;
    }
    const orderPayload = {
      // backend will create no_transaksi automatically
      customer_id: customerId,
      tanggal_order: form.tanggal_order || new Date().toISOString(),
      total_bayar: computeTotal(),
      catatan: form.catatan || null,
    };
    const op = form.id_order ? updateOrder(form.id_order, orderPayload) : createOrder(orderPayload);
    op
      .then((res) => {
        const created = res?.data?.data || res?.data || {};
        const orderId = created.id_order || created.id || null;
        if (!orderId) throw new Error('Order id not returned');
        const detailPromises = orderLines.map((line) => {
          const prod = productsList.find((p) => p.id_produk === Number(line.produk_id) || p.id === Number(line.produk_id));
          const harga = prod?.harga_per_pcs || prod?.harga_per_m2 || 0;
          const qty = Number(line.quantity) || 0;
          const detailPayload = {
            order_id: orderId,
            produk_id: prod?.id_produk || prod?.id || null,
            quantity: qty,
            harga_satuan: harga,
            subtotal_item: harga * qty,
          };
          return createOrderDetail(detailPayload);
        });
        return Promise.all(detailPromises);
      })
      .then(() => {
        showNotification('Order dibuat', 'success');
        handleClose();
        setStep('customer');
        setSelectedCustomer(null);
        reloadOrders().then(() => setDetailsMap({}));
      })
      .catch((err) => {
        console.error(err);
        showNotification('Gagal membuat order', 'error');
      });
  };
  const handleDelete = useCallback((id_order) => {
    // open confirmation dialog first
    setToDeleteId(id_order);
    setDeleteConfirmOpen(true);
  }, [showNotification]);

  const confirmDelete = useCallback(() => {
    const id = toDeleteId;
    if (!id) return setDeleteConfirmOpen(false);
    deleteOrder(id)
      .then(() => {
        showNotification('Order deleted', 'info');
        reloadOrders();
      })
      .catch(() => {
        showNotification('Gagal menghapus order', 'error');
      })
      .finally(() => {
        setDeleteConfirmOpen(false);
        setToDeleteId(null);
      });
  }, [toDeleteId, reloadOrders, showNotification]);

  // Generate invoice link for a specific order row
  const handleGenerateInvoice = useCallback((row) => {
    console.debug('[Orders] handleGenerateInvoice', row?.no_transaksi || row?.id_order);
    setInvoiceError(null);
    setInvoiceResult(null);
    setInvoiceModalOpen(true);
    showNotification('Opening invoice modal', 'info');
    // attach the order we're generating for
    setForm((f) => ({ ...f, __invoice_row: row }));
  }, []);

  // Note: Create via API removed — static link only

  const handleInvoiceModalClose = useCallback(() => {
    setInvoiceModalOpen(false);
    setInvoiceLoading(false);
    setInvoiceError(null);
    setInvoiceResult(null);
    setForm((f) => ({ ...f, __invoice_row: undefined }));
  }, []);

  // Build static link by fetching up-to-date details/payments for the order then encoding
  const handleCreateStaticLink = useCallback(async () => {
    const row = formRef.current.__invoice_row || {};
    if (!row) return setInvoiceError('Order tidak ditemukan');
    setInvoiceError(null);
    setInvoiceLoading(true);
    try {
      // fetch details if not already present in detailsMap
      let details = detailsMap?.[row.id_order];
      if (!details || !details.length) {
        try {
          const r = await getOrderDetailsByOrderId(row.id_order || row.id);
          details = r?.data?.data || r?.data || [];
        } catch {
          details = row.details || [];
        }
      }
      // fetch payments by transaksi if available
      let payments = [];
      const tx = row.no_transaksi || row.no_transaksi_lama || null;
      if (tx) {
        try {
          const rp = await getPaymentsByTransaksi(tx);
          payments = rp?.data?.data || rp?.data || [];
        } catch {
          payments = [];
        }
      }

      const payload = {
        order: {
          id: row.id_order || row.id || null,
          no_transaksi: row.no_transaksi || row.no_transaksi_lama || null,
          nama_customer: row.nama_customer || row.customer?.nama || null,
          total: row.total_bayar || row.total || null,
          tanggal_order: row.tanggal_order || null,
        },
        order_details: Array.isArray(details) ? details : [],
        payments: Array.isArray(payments) ? payments : [],
        created_at: new Date().toISOString(),
      };

      const json = JSON.stringify(payload);
      const b64 = window.btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const url = `${window.location.origin}/invoice/static/${b64}`;
      setInvoiceResult({ url, token: null, expires_at: null });
      showNotification('Static link dibuat (tanpa BE)', 'success');
    } catch (e) {
      console.error('failed to build static link', e);
      setInvoiceError('Gagal membuat static link');
    } finally {
      setInvoiceLoading(false);
    }
  }, [detailsMap, showNotification]);

  const cancelDelete = useCallback(() => { setDeleteConfirmOpen(false); setToDeleteId(null); }, []);
  // handlers for customer step buttons
  const _handleCustomerProceed = () => {
    if (selectedCustomer) { setStep('items'); showNotification('Customer dipilih', 'success'); return; }
    const name = form.customer_name;
    const phone = form.customer_phone;
    searchCustomer(name, phone).then((found) => {
      if (found) {
        setSelectedCustomer(found);
        setForm((f) => ({ ...f, customer_name: found.nama || found.name, customer_phone: found.phone || found.no_hp }));
        showNotification('Customer ditemukan', 'success');
        setStep('items');
      } else {
        showNotification('Customer tidak ditemukan. Tekan Create Customer untuk membuat baru', 'info');
      }
    });
  };
  const _handleCustomerCreate = () => {
    const name = form.customer_name || '';
    if (!name) return showNotification('Nama customer wajib untuk membuat baru', 'error');
    const payload = { nama: name, phone: form.customer_phone || null };
    createCustomer(payload).then((res) => {
      const cust = res?.data?.data || res?.data || payload;
      setSelectedCustomer(cust);
      setCustomersList((s) => ([...(s || []), cust]));
      showNotification('Customer dibuat', 'success');
      setStep('items');
    }).catch(() => showNotification('Gagal membuat customer', 'error'));
  };

  // back handler: if coming from summary, reset customer inputs; otherwise just step back
  const _handleBack = () => {
    if (step === 'summary') {
      // reset customer info when returning from summary per request
      setSelectedCustomer(null);
      setForm((f) => ({ ...f, customer_name: '', customer_phone: '' }));
      setOrderLines((l) => l); // keep product lines when returning? do not reset lines
      setStep('customer');
      return;
    }
    if (step === 'items') {
      setStep('customer');
      return;
    }
  };

  const _itemsValid = () => {
    if (!orderLines || !orderLines.length) return false;
    for (const ln of orderLines) {
      if (!ln.produk_id) return false;
      if ((Number(ln.quantity) || 0) <= 0) return false;
    }
    return true;
  };
  // expansion handled via handleExpandWithDetails

  const handleExpandWithDetails = useCallback((id_order) => {
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

  // Loading state removed: render page immediately so tables and layout remain stable.

  return (
  <Box className="main-card" sx={{ bgcolor: 'var(--main-card-bg)', borderRadius: 4, boxShadow: '0 0 24px #fbbf2433', px: { xs: 2, md: 2 }, pt: { xs: 1.5, md: 2 }, width: '100%', mt: { xs: 2, md: 4 }, fontFamily: 'Poppins, Inter, Arial, sans-serif' }}>
    <style>{scrollbarStyle}</style>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#ffe066', letterSpacing: 1, mt: 0 }}>
            Orders
          </Typography>
          {/* Move search/filter toolbar next to title for compact header */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableToolbar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search orders by invoice, customer or note"
              filterValue={statusFilter}
              onFilterChange={setStatusFilter}
              filterOptions={[{ value: 'pending', label: 'Pending' }, { value: 'completed', label: 'Completed' }]}
              filter2Value={statusBayarFilter}
              onFilter2Change={setStatusBayarFilter}
              filter2Options={[{ value: 'lunas', label: 'Lunas' }, { value: 'belum_lunas', label: 'Belum Lunas' }, { value: 'dp', label: 'DP' }]}
              filter2Label="Status Bayar"
              noWrap={true}
              extraControls={(
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Autocomplete
                    size="small"
                    options={customersList || []}
                    getOptionLabel={(o) => {
                      if (!o) return '';
                      return String(o.nama || o.name || o.phone || o.no_hp || o).toString();
                    }}
                    isOptionEqualToValue={(option, value) => {
                      // compare by common id fields or by phone/name string
                      const oid = option?.id_customer || option?.id || option?.customer_id || null;
                      const vid = value?.id_customer || value?.id || value?.customer_id || null;
                      if (oid && vid) return String(oid) === String(vid);
                      // fallback to compare phone or name
                      return String(option?.phone || option?.no_hp || option?.nama || option?.name || option || '').toLowerCase() === String(value?.phone || value?.no_hp || value?.nama || value?.name || value || '').toLowerCase();
                    }}
                    value={customerFilter}
                    onChange={(e, v) => setCustomerFilter(v)}
                    renderInput={(params) => <TextField {...params} label="Customer" variant="outlined" size="small" fullWidth sx={{ bgcolor: 'rgba(var(--bg-rgb),0.02)' }} />}
                    sx={{ minWidth: 240 }}
                    clearOnBlur={false}
                  />
                  <TextField size="small" variant="outlined" label="Total Min" value={totalMinFilter} onChange={(e) => setTotalMinFilter(e.target.value)} sx={{ width: 120 }} />
                  <TextField size="small" variant="outlined" label="Total Max" value={totalMaxFilter} onChange={(e) => setTotalMaxFilter(e.target.value)} sx={{ width: 120 }} />
                </Box>
              )}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="contained" sx={{ bgcolor: '#ffe066', color: 'var(--button-text)', fontWeight: 700, borderRadius: 3, boxShadow: '0 0 8px #ffe06655', '&:hover': { bgcolor: '#ffd60a' }, textTransform: 'none' }} onClick={() => handleOpen()}>
            Add Order
          </Button>
          <Button variant="outlined" sx={{ color: 'var(--text)', borderRadius: 3, textTransform: 'none' }} onClick={() => reloadOrders()}>
            Refresh
          </Button>
          {/* On small screens show toolbar below header inside paper via fallback */}
        </Box>
      </Box>

      {_error && (
        <Box sx={{ color: 'orange', mb: 2 }}>{_error}</Box>
      )}

      {/* Container: make flex children able to shrink and allow inner scroll
          Important: set minHeight: 0 on flex containers/children so overflow:auto works
      */}
    {/* Inject page-level scrollbar style (same as modal) to ensure it applies with sufficient specificity */}
    <style dangerouslySetInnerHTML={{ __html: scrollbarStyle }} />
      <Box sx={{ width: '100%', height: { xs: 520, md: 720 }, borderRadius: 0, p: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'hidden', minHeight: 0 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'hidden', pt: 0, px: 0, pb: 2, minHeight: 0 }}>
          {/* The actual scrollable area */}
          <Box
            className="modal-scroll"
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--scroll-thumb-color) var(--scroll-track-color)',
              '&::-webkit-scrollbar': { width: 10, height: 10 },
              '&::-webkit-scrollbar-track': { background: 'var(--scroll-track, transparent)' },
              '&::-webkit-scrollbar-thumb': { background: 'var(--scroll-thumb)', borderRadius: 8, boxShadow: '0 0 8px rgba(var(--text-rgb),0.06)' },
              '&::-webkit-scrollbar-thumb:hover': { background: 'var(--scroll-thumb)' },
            }}
          >
              {_loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', py: 4 }}>
                  <Box sx={{ width: '100%', maxWidth: 540 }}>
                    {ordersProgress.total > 0 ? (
                      <>
                        <Typography variant="caption">Loading orders ({ordersProgress.done}/{ordersProgress.total}) — {Math.round((ordersProgress.done / Math.max(1, ordersProgress.total)) * 100)}%</Typography>
                        <LinearProgress variant="determinate" value={Math.round((ordersProgress.done / Math.max(1, ordersProgress.total)) * 100)} sx={{ height: 8, borderRadius: 2, mt: 1 }} />
                      </>
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress />
                        <Typography sx={{ mt: 1 }}>Loading orders...</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              ) : (
                <OrdersTable
                  data={filteredData}
                  expanded={expanded}
                  detailsMap={detailsMap}
                  detailsLoading={detailsLoading}
                  onOpen={handleOpen}
                  onDelete={handleDelete}
                  onExpand={handleExpandWithDetails}
                  onGenerateInvoice={handleGenerateInvoice}
                  productsList={productsList}
                  customersMap={customersMap}
                />
              )}
          </Box>
        </Box>
      </Box>
    <OrderDialog open={dialogOpen} onClose={handleDialogClose} productsList={productsList} customersList={customersList} onCreated={() => { reloadOrders(); setDetailsMap({}); }} initialOrder={editingOrder} />
    
    <Dialog open={deleteConfirmOpen} onClose={cancelDelete}>
      <DialogTitle>Confirm delete</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'var(--text)' }}>Apakah Anda yakin ingin menghapus order ini? Tindakan ini tidak dapat dikembalikan.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={cancelDelete}>Batal</Button>
        <Button color="error" variant="contained" onClick={confirmDelete}>Hapus</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={invoiceModalOpen} onClose={handleInvoiceModalClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generate Invoice Link</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {invoiceLoading && (
            <Typography sx={{ color: 'var(--muted)' }}>Membuat link...</Typography>
          )}
          {invoiceError && (
            <Typography sx={{ color: '#f87171' }}>{invoiceError}</Typography>
          )}
          {invoiceResult && (
            <Box>
              <TextField fullWidth value={invoiceResult.url || ''} InputProps={{ readOnly: true }} label="Public Invoice URL" />
              <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
                <Button onClick={() => { navigator.clipboard?.writeText(invoiceResult.url || ''); showNotification('Link disalin', 'success'); }}>Copy</Button>
                <Button component="a" href={invoiceResult.url || '#'} target="_blank" rel="noopener noreferrer" variant="contained">Open</Button>
              </Box>
              {invoiceResult.expires_at && (
                <Typography variant="caption" sx={{ color: 'var(--muted)', mt: 1 }}>Expires at: {new Date(invoiceResult.expires_at).toLocaleString('id-ID')}</Typography>
              )}
            </Box>
          )}
          {!invoiceLoading && !invoiceResult && (
            <Typography sx={{ color: 'var(--muted)' }}>Klik "Create" untuk membuat link invoice publik untuk order ini.</Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleInvoiceModalClose}>Close</Button>
        {!invoiceResult && (
          <>
            <Button variant="outlined" onClick={handleCreateStaticLink}>Create static link (no BE)</Button>
            {/* Create via API removed; static link is the only option now */}
          </>
        )}
      </DialogActions>
    </Dialog>
    </Box>
  );
}

export default Orders;

