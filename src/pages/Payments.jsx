import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Table,
  TableContainer,
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
  Chip,
  MenuItem,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/Check';
import { useSearchParams } from 'react-router-dom';

import { getPayments, getPaymentById, createPayment, updatePayment, deletePayment, getPaymentsByTransaksi } from '../api/payments';
import useToolbarSync from '../hooks/useToolbarSync';
import { getCustomersByPhone } from '../api/customers';
import { getOrderByTransaksi } from '../api/orders';
import useNotificationStore from '../store/notificationStore';
import TableToolbar from '../components/TableToolbar';
import { useTableColumns } from '../hooks/useTableSettings';

// Dynamic payment row that renders columns driven by visibleColumns and a renderTableCell mapper
const PaymentRow = React.memo(function PaymentRow({ row, rowIndex, expanded, detailsMap, detailsLoading, visibleColumns, renderTableCell }) {
  const id = row.id_payment || row.id;

  return (
    <>
      <TableRow sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
        {visibleColumns.map((col) => (
          <React.Fragment key={`cell-${id}-${col.key}`}>
            {renderTableCell ? (
              renderTableCell(col.key, row, col.align, rowIndex)
            ) : (
              <TableCell align={col.align}>{row[col.key] ?? '-'}</TableCell>
            )}
          </React.Fragment>
        ))}
      </TableRow>

      <TableRow>
        <TableCell colSpan={visibleColumns.length} sx={{ p: 0, border: 0 }}>
          <Collapse in={expanded === id} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom>Payment Details</Typography>
              {detailsLoading[id] ? (
                <Typography>Loading details...</Typography>
              ) : detailsMap[id] ? (
                <Box>
                  <Typography><strong>No Transaksi:</strong> {detailsMap[id].no_transaksi || detailsMap[id].reference || '-'}</Typography>
                  <Typography><strong>No HP:</strong> {detailsMap[id].no_hp || '-'}</Typography>
                  <Typography><strong>Tipe:</strong> {detailsMap[id].tipe || '-'}</Typography>
                  <Typography><strong>Bukti:</strong> {detailsMap[id].bukti ? <a href={detailsMap[id].bukti} target="_blank" rel="noreferrer">Open</a> : '-'}</Typography>
                  <Typography><strong>Notes:</strong> {detailsMap[id].notes || detailsMap[id].catatan || '-'}</Typography>
                  <Typography><strong>Tanggal:</strong> {detailsMap[id].tanggal ? new Date(detailsMap[id].tanggal).toLocaleString() : '-'}</Typography>
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

function Payments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(null);
  const [externalFilters, setExternalFilters] = useState({});
  const [_error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});
  const [detailsLoading, setDetailsLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [verifyDialog, setVerifyDialog] = useState({ open: false, id: null, form: {} });
  const [verifySuggested, setVerifySuggested] = useState({ remaining: null, suggestedStatus: '', total: null, paid: null, customerName: '', customerPhone: '', type: '' });
  const [verifyImageError, setVerifyImageError] = useState(false);
  const [verifyImagePreviewUrl, setVerifyImagePreviewUrl] = useState('');
  const [verifyImageOpen, setVerifyImageOpen] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyFormLocal, setVerifyFormLocal] = useState({});
  const { showNotification } = useNotificationStore();
  // Use the payments column configuration for table head/visibility
  const { visibleColumns } = useTableColumns('payments');

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '' || value == null) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    setSearchParams(params)
  }

  const reloadPayments = useCallback(() => {
    // start loading + progress animation
    setLoading(true);
    try {
      setProgress(5);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          // gently increase progress up to 85% while fetching
          const next = Math.min(85, p + Math.floor(Math.random() * 8) + 3);
          return next;
        });
      }, 300);
    } catch (err) {}

    return getPayments()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        const arr = Array.isArray(items) ? items : [];
        setData(arr);
        setError(null);

        // attempt to infer total count from common API shapes
        const totalFromBody = res?.data?.total ?? res?.data?.meta?.total ?? res?.data?.pagination?.total;
        const totalFromHeader = res?.headers && (res.headers['x-total-count'] || res.headers['x-total']) ? Number(res.headers['x-total-count'] || res.headers['x-total']) : null;
        const inferredTotal = totalFromBody ?? totalFromHeader ?? arr.length;
        setLoadedCount(arr.length);
        setTotalCount(inferredTotal);
        // if we have a total, update progress to reflect actual percentage
        if (inferredTotal) {
          const pct = Math.min(100, Math.round((arr.length / Math.max(1, inferredTotal)) * 100));
          setProgress(pct);
        }
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setData([]);
          setError('Data payment tidak ditemukan.');
        } else {
          setError('Gagal memuat data payments');
        }
      })
      .finally(() => {
        // stop progress animation and complete
        try { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } } catch (e) {}
        setProgress((prev) => (prev >= 100 ? 100 : 100));
        // small delay so the progress bar reaches 100% visually
        setTimeout(() => setProgress(0), 150);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    reloadPayments();
  }, [reloadPayments]);

  // cleanup interval on unmount
  useEffect(() => {
    return () => {
      try { if (intervalRef.current) clearInterval(intervalRef.current); } catch (e) {}
    };
  }, []);
  // Sync toolbar events to URL params via hook (keys chosen for Payments page)
  useToolbarSync({ searchParams, setSearchParams, keys: ['status', 'tipe', 'type', 'no_transaksi', 'customer', 'no_hp', 'nominal_min', 'nominal_max', 'date_from', 'date_to', 'has_bukti'] })

  // Extra defensive listener: ensure tipe changes from AppMainToolbar always update URL params
  useEffect(() => {
    const handleTipeFilter = (e) => {
      try {
        const all = e?.detail?.allFilters || {}
        // keep a local copy so filters apply immediately even if URL sync lags
        setExternalFilters(all || {})
        if (all && Object.prototype.hasOwnProperty.call(all, 'tipe')) {
          updateParam('tipe', all.tipe)
        }
        // also support legacy 'type' key
        if (all && Object.prototype.hasOwnProperty.call(all, 'type')) {
          updateParam('tipe', all.type)
        }
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('toolbar:filter', handleTipeFilter)
    return () => window.removeEventListener('toolbar:filter', handleTipeFilter)
  }, [searchParams])

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      showNotification('🔄 Refreshing payments...', 'info')
      reloadPayments().then(() => {
        showNotification(`✅ ${data.length} payments loaded`, 'success')
      }).catch(() => {
        showNotification('❌ Failed to refresh payments', 'error')
      })
    }
    
    window.addEventListener('app:refresh:payments', handleRefresh)
    return () => window.removeEventListener('app:refresh:payments', handleRefresh)
  }, [reloadPayments, data.length, showNotification])

  const handleOpen = useCallback((item = {}) => {
    setForm(item);
    setErrors({});
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);
  const handleChange = useCallback((e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value })), []);

  const handleSave = () => {
    const newErrors = {};
    if (!form.no_transaksi?.trim()) newErrors.no_transaksi = 'Transaction number is required';
    if (!form.nominal || Number(form.nominal) <= 0) newErrors.nominal = 'Amount must be greater than 0';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const promise = form.id_payment || form.id ? 
      updatePayment(form.id_payment || form.id, form) : 
      createPayment(form);
      
    promise
      .then(() => {
        showNotification(`Payment ${form.id_payment || form.id ? 'updated' : 'created'} successfully`, 'success');
        handleClose();
        reloadPayments();
      })
      .catch((err) => {
        showNotification(`Failed to ${form.id_payment || form.id ? 'update' : 'create'} payment`, 'error');
        console.error(err);
      });
  };

  const searchQuery = searchParams.get('q') || ''
  const statusFilter = searchParams.get('status') || ''
  const tipeFilter = searchParams.get('tipe') || ''
  const noTransaksiFilter = searchParams.get('no_transaksi') || ''
  const customerFilter = searchParams.get('customer') || ''
  const noHpFilter = searchParams.get('no_hp') || ''
  const nominalMin = Number(searchParams.get('nominal_min') || '') || null
  const nominalMax = Number(searchParams.get('nominal_max') || '') || null
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''
  const hasBukti = searchParams.get('has_bukti') || ''

  // Smart unified search parser: supports tokens like
  // tx:..., name:"first last", hp:..., amt>100, amt<500, tipe:dp, status:verified
  const parseSmartQuery = (input) => {
    const q = String(input || '').trim();
    const crit = { text: '', tx: '', name: '', hp: '', amtMin: null, amtMax: null, tipe: '', status: '' };
    if (!q) return crit;

    let remaining = q;

    // match key:"value with spaces" or key:'value' or key:value
    const kvRegex = /(\b(?:tx|no_transaksi|no|name|n|hp|h|tipe|status)\b)\s*:\s*(?:"([^"]+)"|'([^']+)'|([^\s]+))/gi;
    let m;
    while ((m = kvRegex.exec(q)) !== null) {
      const key = (m[1] || '').toLowerCase();
      const value = m[2] || m[3] || m[4] || '';
      remaining = remaining.replace(m[0], '');
      if (['tx', 'no', 'no_transaksi'].includes(key)) crit.tx = value;
      else if (['name', 'n'].includes(key)) crit.name = value;
      else if (['hp', 'h'].includes(key)) crit.hp = value;
      else if (key === 'tipe') crit.tipe = value;
      else if (key === 'status') crit.status = value;
    }

    // match amt comparisons like amt>100 or amount>=200
    const amtCompRegex = /(?:\b(?:amt|amount)\b)?\s*([<>]=?)\s*([0-9.,]+)/gi;
    while ((m = amtCompRegex.exec(q)) !== null) {
      const op = m[1];
      const num = Number(String(m[2] || '').replace(/[.,]/g, '')) || 0;
      if (op.includes('>')) {
        // >= or >
        if (op.includes('=')) crit.amtMin = Math.max(crit.amtMin || 0, num);
        else crit.amtMin = Math.max(crit.amtMin || 0, num + 1);
      } else if (op.includes('<')) {
        if (op.includes('=')) crit.amtMax = Math.min(crit.amtMax == null ? num : crit.amtMax, num);
        else crit.amtMax = Math.min(crit.amtMax == null ? num : crit.amtMax, num - 1);
      }
      remaining = remaining.replace(m[0], '');
    }

    // match explicit amt:500 or amt:500-1000
    const amtRangeRegex = /\b(?:amt|amount)\s*:\s*([0-9.,]+)(?:\s*-\s*([0-9.,]+))?/i;
    const rangeMatch = remaining.match(amtRangeRegex);
    if (rangeMatch) {
      const a = Number(String(rangeMatch[1] || '').replace(/[.,]/g, '')) || 0;
      const b = Number(String(rangeMatch[2] || '').replace(/[.,]/g, '')) || null;
      if (b != null) { crit.amtMin = a; crit.amtMax = b; }
      else { crit.amtMin = a; }
      remaining = remaining.replace(rangeMatch[0], '');
    }

    // anything left is treated as free-text search
    const free = remaining.trim();
    crit.text = free;
    return crit;
  };

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const tokens = parseSmartQuery(searchQuery || '');
    const q = (tokens.text || '').trim().toLowerCase();
    return data.filter((row) => {
      // smart token checks
      if (tokens.tx) {
        const tx = (row.no_transaksi || row.Order?.no_transaksi || '');
        if (!tx.toLowerCase().includes(String(tokens.tx).toLowerCase())) return false;
      }
      if (tokens.name) {
        const name = (row.Customer?.nama || row.customer_name || row.customer || '');
        if (!name.toLowerCase().includes(String(tokens.name).toLowerCase())) return false;
      }
      if (tokens.hp) {
        const phone = (row.no_hp || row.Customer?.no_hp || row.customer_phone || '');
        if (!phone.toLowerCase().includes(String(tokens.hp).toLowerCase())) return false;
      }
      // precedence: smart tokens -> external toolbar filters -> URL param filters
      if (tokens.tipe) {
        if ((row.tipe || '').toLowerCase() !== String(tokens.tipe).toLowerCase()) return false;
      }
      if (!tokens.tipe && externalFilters && (externalFilters.tipe || externalFilters.type)) {
        const tf = (externalFilters.tipe || externalFilters.type || '').toLowerCase();
        if (tf && (row.tipe || '').toLowerCase() !== tf) return false;
      }
      if (tokens.status) {
        if ((row.status || '').toLowerCase() !== String(tokens.status).toLowerCase()) return false;
      }
      if (tokens.amtMin != null) {
        const amt = Number(row.nominal || row.amount || 0) || 0;
        if (amt < tokens.amtMin) return false;
      }
      if (tokens.amtMax != null) {
        const amt = Number(row.nominal || row.amount || 0) || 0;
        if (amt > tokens.amtMax) return false;
      }

      // legacy explicit param filters (URL params) still apply
      if (statusFilter) {
        if ((row.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
      if (tipeFilter) {
        if ((row.tipe || '').toLowerCase() !== tipeFilter.toLowerCase()) return false;
      }
      if (noTransaksiFilter) {
        const tx = (row.no_transaksi || row.Order?.no_transaksi || '')
        if (!tx.toLowerCase().includes(noTransaksiFilter.toLowerCase())) return false
      }
      if (customerFilter) {
        const name = (row.Customer?.nama || row.customer_name || row.customer || '')
        if (!name.toLowerCase().includes(customerFilter.toLowerCase())) return false
      }
      if (noHpFilter) {
        const phone = (row.no_hp || row.Customer?.no_hp || row.customer_phone || '')
        if (!phone.toLowerCase().includes(noHpFilter.toLowerCase())) return false
      }
      if (dateFrom) {
        const t = row.tanggal ? new Date(row.tanggal) : null
        if (!t) return false
        const from = new Date(dateFrom)
        if (t < from) return false
      }
      if (dateTo) {
        const t = row.tanggal ? new Date(row.tanggal) : null
        if (!t) return false
        // include entire day for dateTo
        const to = new Date(dateTo)
        to.setHours(23,59,59,999)
        if (t > to) return false
      }
      if (hasBukti) {
        const has = !!(row.bukti || row.bukti_url || row.proof)
        if (hasBukti === 'yes' && !has) return false
        if (hasBukti === 'no' && has) return false
      }
      if (nominalMin != null) {
        const amt = Number(row.nominal || row.amount || 0)
        if (amt < nominalMin) return false
      }
      if (nominalMax != null) {
        const amt = Number(row.nominal || row.amount || 0)
        if (amt > nominalMax) return false
      }

      // free-text fallback: search common fields
      if (q) {
        const hay = `${row.no_transaksi || ''} ${row.tipe || ''} ${row.reference || row.referensi || ''} ${row.Order?.no_transaksi || ''} ${row.Customer?.nama || ''} ${row.Customer?.no_hp || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, searchQuery, statusFilter, tipeFilter, noTransaksiFilter, customerFilter, noHpFilter, nominalMin, nominalMax, dateFrom, dateTo, hasBukti]);

  // renderTableCell will be defined later (after handler functions) to avoid referencing handlers before declaration


  

  const handleDelete = useCallback((id) => setDeleteConfirm({ open: true, id }), []);

  const confirmDelete = () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    if (!id) return;
    
    deletePayment(id)
      .then(() => {
        showNotification('Payment deleted successfully', 'success');
        reloadPayments();
      })
      .catch((err) => {
        showNotification('Failed to delete payment', 'error');
        console.error(err);
      });
  };

  // Open verify modal (prefill nominal and load details/invoice to compute suggested status)
  const handleVerify = useCallback((id) => {
    // open dialog and load payment details if available
  setVerifyDialog({ open: true, id, form: { nominal: '', no_transaksi: '' } });
  setVerifyFormLocal({ nominal: '', no_transaksi: '', bukti: '' });
    setVerifyLoading(true);
    // try to load details to prefill nominal and no_transaksi
    return getPaymentById(id)
      .then((res) => {
  const p = res?.data || res || {};
  setVerifyDialog((s) => ({ ...s, form: { nominal: p.nominal || p.amount || '', no_transaksi: p.no_transaksi || p.transaksi || p.reference || '', bukti: p.bukti || p.bukti_url || p.proof || '' } }));
  setVerifyFormLocal({ nominal: p.nominal || p.amount || '', no_transaksi: p.no_transaksi || p.transaksi || p.reference || '', bukti: p.bukti || p.bukti_url || p.proof || '' });
        setDetailsMap((prev) => ({ ...prev, [id]: p }));
        // if we have a transaction number, try to fetch invoice to compute remaining
        const tx = p.no_transaksi || p.transaksi || p.reference || '';
        if (tx) {
          // fetch invoice and payments to compute totals and then fetch customer by phone if possible
          return Promise.all([getOrderByTransaksi(tx).catch(() => null), getPaymentsByTransaksi(tx).catch(() => null)])
            .then(async ([orderRes, payRes]) => {
              const ord = orderRes?.data || orderRes || {};
              const paymentsArr = payRes?.data?.data || payRes?.data || payRes || [];
              // prefer order.total_bayar or order.total_harga as total order amount
              // Prefer order fields: if order provides total_bayar and dp_bayar, use sisa = total_bayar - dp_bayar
              const orderTotalBayar = Number(ord.total_bayar || ord.total || ord.total_harga || 0) || 0;
              const total = orderTotalBayar; // canonical total for later use
              const orderDpBayar = Number(ord.dp_bayar || ord.dp || 0) || 0;
              const paid = Array.isArray(paymentsArr) ? paymentsArr.reduce((acc, it) => acc + (Number(it.nominal || it.amount || 0) || 0), 0) : 0;
              let remaining = 0;
              if (total && (orderDpBayar || orderDpBayar === 0)) {
                // use requested formula: sisa = total_bayar - dp_bayar
                remaining = total - orderDpBayar;
              } else {
                // fallback: remaining = total - paid
                remaining = Math.max(0, total - paid);
              }
              remaining = Math.max(0, remaining);
              const suggestedStatus = nominalCompareSuggestion(Number(p.nominal || p.amount || 0), remaining);
              // try to extract customer phone and name from order
              const customerPhone = p.no_hp || ord.no_hp || ord.no_hp_customer || '';
              let customerName = ord.nama || ord.nama_customer || ord.customer_name || '';
              if (!customerName && customerPhone) {
                try {
                  const cRes = await getCustomersByPhone(customerPhone);
                  const c = cRes?.data?.data || cRes?.data || cRes || {};
                  if (Array.isArray(c) && c.length > 0) customerName = c[0].nama || c[0].name || '';
                  else if (c && c.nama) customerName = c.nama || c.name || '';
                } catch {
                  // ignore
                }
              }
              const type = (paid === 0) ? 'belum_bayar' : (paid < total ? 'dp' : 'lunas');
              setVerifySuggested({ remaining, suggestedStatus, total, paid, customerName, customerPhone, type });
              setVerifyImageError(false);
            })
            .catch(() => setVerifySuggested({ remaining: null, suggestedStatus: '', total: null, paid: null, customerName: '', customerPhone: '', type: '' }));
        }
        return null;
      })
      .catch((err) => {
        // ignore, leave defaults
        console.error('Failed to load payment details for verify modal', err);
      })
      .finally(() => setVerifyLoading(false));
  }, []);

  const nominalCompareSuggestion = (nominal, remaining) => {
    if (remaining == null) return '';
    if (nominal >= remaining) return 'approved';
    if (nominal > 0 && nominal < remaining) return 'pending';
    return '';
  };

  const handleVerifyClose = () => { setVerifyDialog({ open: false, id: null, form: {} }); setVerifyFormLocal({}); };

  // confirm verification: try approve endpoint with nominal then fallback to verify
  const confirmVerify = async () => {
    const id = verifyDialog.id;
    const nominal = Number(verifyFormLocal.nominal || 0);
    if (!id) return;
    if (!nominal || nominal <= 0) {
      showNotification('Nominal harus lebih besar dari 0', 'error');
      return;
    }

    // prefer approve endpoint which accepts nominal
    try {
      // try approvePaymentNominal if available in API
      // import is in api/payments, call via approvePaymentNominal if exists on module
      const paymentsApi = await import('../api/payments');
      if (paymentsApi && paymentsApi.approvePaymentNominal) {
        await paymentsApi.approvePaymentNominal(id, nominal);
      } else if (paymentsApi && paymentsApi.approvePayment) {
        await paymentsApi.approvePayment(id, { nominal });
      } else {
        // fallback to verify endpoint
        await paymentsApi.verifyPayment(id, { nominal });
      }

      showNotification('Payment verified/approved successfully', 'success');
      handleVerifyClose();
      reloadPayments();
    } catch (err) {
      console.error('Failed to approve/verify payment', err);
      showNotification('Failed to verify payment', 'error');
    }
  };

  const handleExpandWithDetails = useCallback((id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!detailsMap[id] && !detailsLoading[id]) {
      setDetailsLoading((prev) => ({ ...prev, [id]: true }));
      getPaymentById(id)
        .then((res) => {
          setDetailsMap((prev) => ({ ...prev, [id]: res?.data || res }));
        })
        .catch((err) => {
          console.error(`Failed to load details for payment ${id}`, err);
          setDetailsMap((prev) => ({ ...prev, [id]: null }));
        })
        .finally(() => {
          setDetailsLoading((prev) => ({ ...prev, [id]: false }));
        });
    }
  }, [expanded, detailsMap, detailsLoading]);

  // Map Orders table column keys to payment row cells. Defined after handlers so they are in scope.
  const renderTableCell = (key, r, align = 'left', rowIndex = null) => {
    const id = r.id_payment || r.id;
    const sanitizePhone = (p) => (String(p || '').replace(/\D/g, ''));
    const formatCurrency = (val) => (val == null || val === '') ? '-' : `Rp ${Number(val).toLocaleString('id-ID')}`;

    switch (key) {
      case 'id':
        return <TableCell align={align}>{id}</TableCell>;
      case 'no':
        return <TableCell align={align}>{rowIndex != null ? (rowIndex + 1) : '-'}</TableCell>;
      case 'orderNo':
        return <TableCell align={align}>{r.no_transaksi || r.Order?.no_transaksi || '-'}</TableCell>;
      case 'orderId':
        return <TableCell align={align}>{r.Order?.id_order || r.orderId || r.id_order || '-'}</TableCell>;
      case 'amount':
        return <TableCell align={align}>{formatCurrency(r.nominal)}</TableCell>;
      // deprecated payment_method fallback removed — use 'tipe' column instead
      case 'idCustomer':
        return <TableCell align={align}>{r.id_customer || r.idCustomer || '-'}</TableCell>;
      case 'customerPhone': {
        const phoneVal = r.no_hp || r.phone || r.Customer?.no_hp || '';
        const s = sanitizePhone(phoneVal);
        return (
          <TableCell align={align}>
            {phoneVal ? <a href={`https://wa.me/${s}`} target="_blank" rel="noreferrer">{phoneVal}</a> : '-'}
          </TableCell>
        );
      }
      case 'customerName':
        // prefer nested Customer name when present
        return <TableCell align={align}>{r.Customer?.nama || r.nama || r.customer_name || r.name || '-'}</TableCell>;
      case 'date':
        return <TableCell align={align}>{r.tanggal ? new Date(r.tanggal).toLocaleString() : '-'}</TableCell>;
      case 'items':
        // Payments don't have items; show type (dp/pelunasan) when available
        return <TableCell align={align}>{r.tipe || '-'}</TableCell>;
      case 'tipe': {
        const label = (r.tipe || '-');
        const map = {
          dp: 'warning',
          pelunasan: 'success'
        };
        const color = map[(r.tipe || '').toLowerCase()] || 'default';
        return (
          <TableCell align={align}>
            <Chip label={String(label)} size="small" color={color} />
          </TableCell>
        );
      }
      case 'linkInvoice': {
        // Not present in payments schema; use bukti as a fallback
        const url = r.bukti || r.bukti_url || r.proof || '';
        return <TableCell align={align}>{url ? <a href={url} target="_blank" rel="noreferrer">Link</a> : '-'}</TableCell>;
      }
      case 'linkDrive': {
        const url = r.bukti || r.bukti_url || r.proof || '';
        return <TableCell align={align}>{url ? <a href={url} target="_blank" rel="noreferrer">Link</a> : '-'}</TableCell>;
      }
      case 'dpBayar':
      case 'totalBayar':
      case 'totalHarga':
        return <TableCell align={align}>{formatCurrency(r.nominal)}</TableCell>;
      case 'status':
      case 'statusBayar': {
        const s = (r.status || '').toLowerCase();
        // humanize label: replace underscores and capitalize words
        const label = r.status ? String(r.status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-';
        let statusColor = 'default';
        if (s === 'pending') statusColor = 'default';
        else if (s === 'menunggu_verifikasi' || s === 'menunggu') statusColor = 'warning';
        else if (['verified', 'confirmed', 'approved'].includes(s)) statusColor = 'success';
        else if (s === 'rejected') statusColor = 'error';

        return (
          <TableCell align={align}>
            <Chip label={label} size="small" color={statusColor} />
          </TableCell>
        );
      }
      case 'actions':
        {
          const s = (r.status || '').toLowerCase();
          return (
            <TableCell align={align} sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-start' }}>
              <IconButton size="small" onClick={() => handleExpandWithDetails(id)}><InfoIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleOpen(r)}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleDelete(id)}><DeleteIcon fontSize="small" /></IconButton>
              {s !== 'verified' && (
                <IconButton size="small" onClick={() => handleVerify(id)}><CheckIcon fontSize="small" /></IconButton>
              )}
            </TableCell>
          );
        }
      default:
        return <TableCell align={align}>{r[key] ?? '-'}</TableCell>;
    }
  };

  const rows = React.useMemo(() => {
    return filteredData.map((row, idx) => (
      <PaymentRow
        key={row.id_payment || row.id}
        rowIndex={idx}
        row={row}
        expanded={expanded}
        detailsLoading={detailsLoading}
        detailsMap={detailsMap}
        onOpen={handleOpen}
        onDelete={handleDelete}
        onExpand={handleExpandWithDetails}
        onVerify={handleVerify}
        visibleColumns={visibleColumns}
        renderTableCell={(k, r, a, i) => renderTableCell(k, r, a, i)}
      />
    ));
  }, [filteredData, expanded, detailsLoading, detailsMap, handleOpen, handleDelete, handleExpandWithDetails, handleVerify, visibleColumns, renderTableCell]);

  // Filter options
  const statusFilterOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ]

  const tipeFilterOptions = [
    { value: 'dp', label: 'DP' },
    { value: 'pelunasan', label: 'Pelunasan' },
  ]

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
            <TableToolbar
            value={searchParams.get('q') || ''}
            onChange={(value) => updateParam('q', value)}
            placeholder="Search payments — supports tx:, name:, hp:, amt>, amt<, tipe:, status:"
            hideFilters
            statusFilters={[
              {
                label: 'Status',
                value: searchParams.get('status') || '',
                onChange: (value) => updateParam('status', value),
                options: statusFilterOptions
              },
              {
                label: 'Tipe',
                value: searchParams.get('tipe') || '',
                onChange: (value) => updateParam('tipe', value),
                options: tipeFilterOptions
              }
            ]}
            
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            startIcon={<RefreshIcon />} 
            variant="outlined" 
            size="small" 
            onClick={() => window.dispatchEvent(new CustomEvent('app:refresh:payments'))}
          >
            Refresh
          </Button>
          <Button 
            startIcon={<AddIcon />} 
            variant="contained" 
            size="small" 
            onClick={() => handleOpen()}
          >
            Add Payment
          </Button>
        </Box>
      </Box>

      {/* Payments Table */}
      {progress > 0 && (
        <Box sx={{ width: '100%', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
          <Box sx={{ minWidth: 120, textAlign: 'right' }}>
            <Typography variant="body2">
              {loadedCount ?? 0}{totalCount != null ? ` / ${totalCount}` : ''} — {totalCount ? `${Math.round(((loadedCount||0) / Math.max(1, totalCount)) * 100)}%` : `${progress}%`}
            </Typography>
          </Box>
        </Box>
      )}
      <TableContainer className="table-responsive" sx={{ maxHeight: 'clamp(40vh, calc(100vh - var(--header-height) - 160px), 75vh)', overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableCell key={`hdr-${col.key}`} align={col.align}>{col.label || col.key}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length}>
                  <Typography>
                    {data.length === 0 ? 'No payments found' : 'No payments match current filters'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Payment Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id_payment || form.id ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
        <DialogContent>
          {verifyLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Transaction Number"
              name="no_transaksi"
              value={form.no_transaksi || ''}
              onChange={handleChange}
              error={!!errors.no_transaksi}
              helperText={errors.no_transaksi}
              fullWidth
            />
            <TextField
              label="Amount"
              name="nominal"
              type="number"
              value={form.nominal || form.amount || ''}
              onChange={handleChange}
              error={!!errors.nominal}
              helperText={errors.nominal}
              fullWidth
            />
            <TextField
              label="Payment Method"
              name="payment_method"
              select
              value={form.payment_method || form.metode_bayar || ''}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="">Select Method</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="transfer">Bank Transfer</MenuItem>
              <MenuItem value="credit_card">Credit Card</MenuItem>
              <MenuItem value="e_wallet">E-Wallet</MenuItem>
            </TextField>
            <TextField
              label="Reference"
              name="reference"
              value={form.reference || form.referensi || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Notes"
              name="notes"
              value={form.notes || form.catatan || ''}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Large image preview dialog */}
      <Dialog open={verifyImageOpen} onClose={() => setVerifyImageOpen(false)} maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Bukti Preview
          <IconButton size="small" onClick={() => setVerifyImageOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {verifyImagePreviewUrl ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img src={verifyImagePreviewUrl} alt="bukti-large" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
            </Box>
          ) : (
            <Typography>No image available</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this payment?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Verify / Approve Payment Dialog */}
      <Dialog open={verifyDialog.open} onClose={handleVerifyClose} maxWidth="sm" fullWidth>
        <DialogTitle>Verify / Approve Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Transaction No"
              name="no_transaksi"
              value={verifyFormLocal.no_transaksi || ''}
              onChange={(e) => setVerifyFormLocal((s) => ({ ...s, no_transaksi: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Nominal to approve"
              name="nominal"
              type="number"
              value={verifyFormLocal.nominal || ''}
              onChange={(e) => setVerifyFormLocal((s) => ({ ...s, nominal: e.target.value }))}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="Bukti (link)"
                name="bukti"
                value={verifyFormLocal.bukti || detailsMap[verifyDialog.id]?.bukti || ''}
                onChange={(e) => { setVerifyFormLocal((s) => ({ ...s, bukti: e.target.value })); setVerifyImageError(false); }}
                fullWidth
              />
              <Button
                size="small"
                disabled={!((verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || '').trim())}
                onClick={() => {
                  const url = (verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || '').trim();
                  if (!url) return;
                  setVerifyImagePreviewUrl(url);
                  setVerifyImageOpen(true);
                }}
              >Preview</Button>
              <Button
                size="small"
                disabled={!((verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || '').trim())}
                onClick={() => {
                  const url = (verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || '').trim();
                  if (!url) return;
                  window.open(url, '_blank');
                }}
              >Open</Button>
            </Box>
            {(verifySuggested.total != null || (verifyDialog.id && detailsMap[verifyDialog.id])) && (
              <Box sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                <Typography variant="body2"><strong>Nama Customer:</strong> {verifySuggested.customerName || '-'}</Typography>
                <Typography variant="body2"><strong>No HP:</strong> {verifySuggested.customerPhone || detailsMap[verifyDialog.id]?.no_hp || '-'}</Typography>
                <Typography variant="body2"><strong>Total Pesanan:</strong> Rp {Number(verifySuggested.total || 0).toLocaleString('id-ID')}</Typography>
                <Typography variant="body2"><strong>Total Dibayar:</strong> Rp {Number(verifySuggested.paid || 0).toLocaleString('id-ID')}</Typography>
                <Typography variant="body2"><strong>Sisa yang harus dibayar:</strong> Rp {Number(verifySuggested.remaining || 0).toLocaleString('id-ID')}</Typography>
                <Typography variant="body2"><strong>Type:</strong> {verifySuggested.type || detailsMap[verifyDialog.id]?.tipe || '-'}</Typography>
                {verifySuggested.suggestedStatus && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>Suggested status: <strong>{verifySuggested.suggestedStatus}</strong></Typography>
                )}
              </Box>
            )}
            {/* Preview link for bukti/proof if available in detailsMap for this id */}
            {verifyDialog.id && detailsMap[verifyDialog.id] && (() => {
              const d = detailsMap[verifyDialog.id];
              const url = d.bukti || d.bukti_url || d.proof || d.file || d.image || d.attachment || d.bukti_transfer || d.proof_url;
              if (!url) return null;
              return (
                <Box>
                      <Typography variant="subtitle2">Preview bukti</Typography>
                      {/* stable container to avoid layout shift when image is missing or fails to load */}
                      <Box sx={{ mt: 1, mb: 1, minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: verifyImageError ? 'action.hover' : 'transparent', borderRadius: 1, p: 1 }}>
                        {!verifyImageError ? (
                          <img
                            src={url}
                            alt="bukti"
                            style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 8, cursor: 'pointer' }}
                            onError={() => setVerifyImageError(true)}
                            onClick={() => { setVerifyImagePreviewUrl(url); setVerifyImageOpen(true); }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">Preview tidak tersedia. Klik "Open Bukti" untuk membuka di tab baru.</Typography>
                        )}
                      </Box>
                      <Button size="small" onClick={() => window.open(url, '_blank')}>Open Bukti</Button>
                </Box>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleVerifyClose}>Cancel</Button>
          <Button onClick={confirmVerify} variant="contained" color="success">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Payments;