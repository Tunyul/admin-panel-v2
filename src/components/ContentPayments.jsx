import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
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
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { useSearchParams } from 'react-router-dom';

import { getPaymentsWithParams, getPaymentById, createPayment, updatePayment, deletePayment, getPaymentsByTransaksi } from '../api/payments';
import { getCustomersByPhone } from '../api/customers';
import { getOrderByTransaksi } from '../api/orders';
import useNotificationStore from '../store/notificationStore';
import { useTableColumns, useTableSorting } from '../hooks/useTableSettings';

// PaymentRow - small, memoized row renderer used by the table
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

export default function ContentPayments() {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const { visibleColumns } = useTableColumns('payments');
  const tableId = 'payments';
  const { sortConfig, handleSort: handleSortGlobal, getSortDirection } = useTableSorting(tableId);

  // Local handler that updates global sorting and notifies the toolbar
  const handleSort = (key) => {
    try {
      handleSortGlobal(key);
      const newSortKey = sortConfig.key === key && sortConfig.direction === 'desc' ? null : key;
      const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
      window.dispatchEvent(new CustomEvent('toolbar:sort-change', { detail: { sortKey: newSortKey, direction } }));
    } catch (err) {
      // ignore
    }
  };

  // Persist sort config to URL so sort state survives reloads and is shareable
  useEffect(() => {
    try {
      const key = sortConfig.key;
      const dir = sortConfig.direction || 'asc';
      const params = new URLSearchParams(searchParams.toString());
      if (!key) {
        params.delete('sort');
        params.delete('sort_dir');
      } else {
        params.set('sort', String(key));
        params.set('sort_dir', String(dir));
      }
      // push to router without removing other unrelated params
      setSearchParams(params);
    } catch (err) {
      // ignore
    }
  }, [sortConfig.key, sortConfig.direction]);

  // helper to convert current URL search params to a plain object
  const paramsObject = useCallback(() => {
    const obj = {};
    for (const [k, v] of searchParams.entries()) {
      if (v !== undefined && v !== null && String(v) !== '') obj[k] = v;
    }
    return obj;
  }, [searchParams]);

  const updateParam = React.useCallback((key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === '' || value == null) params.delete(key);
    else params.set(key, value);
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Reload payments from server using current search params so server-side filters apply
  const reloadPayments = useCallback((extraParams = {}) => {
    setLoading(true);
    try {
      setProgress(5);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setProgress((p) => Math.min(85, p + Math.floor(Math.random() * 8) + 3));
      }, 300);
    } catch (e) { console.error(e); }

  const params = { ...(paramsObject() || {}), ...(extraParams || {}) };
  // Ensure status filtering is disabled for Payments: do not forward `status` to API
  try {
    if (params && Object.prototype.hasOwnProperty.call(params, 'status')) delete params.status;
  } catch (e) {}
  try { console.debug('[ContentPayments] reloadPayments params=', params); } catch (e) {}
    return getPaymentsWithParams(params)
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        const arr = Array.isArray(items) ? items : [];
        setData(arr);
        setError(null);

        const totalFromBody = res?.data?.total ?? res?.data?.meta?.total ?? res?.data?.pagination?.total;
        const totalFromHeader = res?.headers && (res.headers['x-total-count'] || res.headers['x-total']) ? Number(res.headers['x-total-count'] || res.headers['x-total']) : null;
        const inferredTotal = totalFromBody ?? totalFromHeader ?? arr.length;
        setLoadedCount(arr.length);
        setTotalCount(inferredTotal);
        if (inferredTotal) {
          const pct = Math.min(100, Math.round((arr.length / Math.max(1, inferredTotal)) * 100));
          setProgress(pct);
        }
        // return loaded array so callers can react to the fresh data count
        return arr;
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
          try { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } } catch (e) { console.error(e); }
          setProgress((prev) => (prev >= 100 ? 100 : 100));
          setTimeout(() => setProgress(0), 150);
          setLoading(false);
        });
  }, [paramsObject]);

  // initial load and reload when search params change
  const searchParamsString = searchParams.toString();
  useEffect(() => {
    try { console.debug('[ContentPayments] searchParams changed ->', searchParams.toString()); } catch (e) {}
    reloadPayments();
  }, [reloadPayments, searchParamsString]);

  useEffect(() => {
    return () => {
      try { if (intervalRef.current) clearInterval(intervalRef.current); } catch (e) { console.error(e); }
    };
  }, []);

  // Allow external components/pages to open the Add Payment dialog
  useEffect(() => {
    const handler = () => {
      try { setOpen(true); } catch (err) { console.error(err); }
    };
    window.addEventListener('app:open:add-payment', handler);
    return () => window.removeEventListener('app:open:add-payment', handler);
  }, []);

  // listen for toolbar filter events (keeps externalFilters in sync and URL params)
  useEffect(() => {
    const handleTipeFilter = (e) => {
      try {
        const detail = e?.detail || {};
        const page = detail.page || null;
        if (!page || !String(page).startsWith('/payments')) return;
        const all = detail.allFilters || {};
  setExternalFilters(all || {});
  // Write the page-scoped filters into the router search params so the
  // component's searchParams effect will pick them up and trigger reload.
  try {
    const pageKeys = ['no_transaksi','no_hp','tipe','nominal_min','nominal_max','has_bukti','date_from','date_to'];
    const params = new URLSearchParams();
    pageKeys.forEach((k) => {
      const v = all[k];
      if (v !== undefined && v !== null && String(v) !== '') params.set(k, String(v));
    });
    setSearchParams(params);
  } catch (err) {
    console.error('Failed to sync toolbar filters to search params', err);
  }
      } catch (err) { console.error(err); }
    };
    window.addEventListener('toolbar:filter', handleTipeFilter);
    return () => window.removeEventListener('toolbar:filter', handleTipeFilter);
  }, [searchParams, updateParam]);

  // Listen for explicit refresh events
  useEffect(() => {
    const handleRefresh = () => {
      showNotification('🔄 Refreshing payments...', 'info');
      reloadPayments()
        .then((items) => showNotification(`✅ ${Array.isArray(items) ? items.length : 0} payments loaded`, 'success'))
        .catch(() => showNotification('❌ Failed to refresh payments', 'error'));
    };
    window.addEventListener('app:refresh:payments', handleRefresh);
    return () => window.removeEventListener('app:refresh:payments', handleRefresh);
  }, [reloadPayments, data.length, showNotification]);

  const handleOpen = useCallback((item = {}) => { setForm(item); setErrors({}); setOpen(true); }, []);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleChange = useCallback((e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value })), []);

  const handleSave = () => {
    const newErrors = {};
    if (!form.no_transaksi?.trim()) newErrors.no_transaksi = 'Transaction number is required';
    if (!form.nominal || Number(form.nominal) <= 0) newErrors.nominal = 'Amount must be greater than 0';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    const promise = form.id_payment || form.id ? updatePayment(form.id_payment || form.id, form) : createPayment(form);
    promise.then(() => { showNotification(`Payment ${form.id_payment || form.id ? 'updated' : 'created'} successfully`, 'success'); handleClose(); reloadPayments(); }).catch((err) => { showNotification(`Failed to ${form.id_payment || form.id ? 'update' : 'create'} payment`, 'error'); console.error(err); });
  };

  const searchQuery = searchParams.get('q') || '';
  const tipeFilter = searchParams.get('tipe') || '';
  const noTransaksiFilter = searchParams.get('no_transaksi') || '';
  const customerFilter = searchParams.get('customer') || '';
  const noHpFilter = searchParams.get('no_hp') || '';
  const nominalMin = Number(searchParams.get('nominal_min') || '') || null;
  const nominalMax = Number(searchParams.get('nominal_max') || '') || null;
  const dateFrom = searchParams.get('date_from') || '';
  const dateTo = searchParams.get('date_to') || '';
  const hasBukti = searchParams.get('has_bukti') || '';

  // smart query parser copied from previous implementation (keeps client-side filtering available)
  const parseSmartQuery = (input) => {
    const q = String(input || '').trim();
    const crit = { text: '', tx: '', name: '', hp: '', amtMin: null, amtMax: null, tipe: '' };
    if (!q) return crit;
    let remaining = q;
    const kvRegex = /(\b(?:tx|no_transaksi|no|name|n|hp|h|tipe)\b)\s*:\s*(?:"([^"]+)"|'([^']+)'|([^\s]+))/gi;
    let m;
    while ((m = kvRegex.exec(q)) !== null) {
      const key = (m[1] || '').toLowerCase();
      const value = m[2] || m[3] || m[4] || '';
      remaining = remaining.replace(m[0], '');
      if (['tx', 'no', 'no_transaksi'].includes(key)) crit.tx = value;
      else if (['name', 'n'].includes(key)) crit.name = value;
      else if (['hp', 'h'].includes(key)) crit.hp = value;
      else if (key === 'tipe') crit.tipe = value;
    }
    const amtCompRegex = /(?:\b(?:amt|amount)\b)?\s*([<>]=?)\s*([0-9.,]+)/gi;
    while ((m = amtCompRegex.exec(q)) !== null) {
      const op = m[1];
      const num = Number(String(m[2] || '').replace(/[.,]/g, '')) || 0;
      if (op.includes('>')) { if (op.includes('=')) crit.amtMin = Math.max(crit.amtMin || 0, num); else crit.amtMin = Math.max(crit.amtMin || 0, num + 1); }
      else if (op.includes('<')) { if (op.includes('=')) crit.amtMax = Math.min(crit.amtMax == null ? num : crit.amtMax, num); else crit.amtMax = Math.min(crit.amtMax == null ? num : crit.amtMax, num - 1); }
      remaining = remaining.replace(m[0], '');
    }
    const amtRangeRegex = /\b(?:amt|amount)\s*:\s*([0-9.,]+)(?:\s*-\s*([0-9.,]+))?/i;
    const rangeMatch = remaining.match(amtRangeRegex);
    if (rangeMatch) {
      const a = Number(String(rangeMatch[1] || '').replace(/[.,]/g, '')) || 0;
      const b = Number(String(rangeMatch[2] || '').replace(/[.,]/g, '')) || null;
      if (b != null) { crit.amtMin = a; crit.amtMax = b; } else { crit.amtMin = a; }
      remaining = remaining.replace(rangeMatch[0], '');
    }
    crit.text = remaining.trim();
    return crit;
  };

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const tokens = parseSmartQuery(searchQuery || '');
    const q = (tokens.text || '').trim().toLowerCase();
    const res = data.filter((row) => {
      if (tokens.tx) {
        // Only check payment-local transaction fields for filtering (avoid reading Order rel)
        const tx = (row.no_transaksi || row.transaksi || row.reference || row.referensi || '');
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
      const rowTipeVal = String(row.tipe || row.type || row.payment_type || '').trim().toLowerCase();
      // tolerant matcher for `tipe` (allows synonyms like 'downpayment' -> 'dp')
      const normalizeValue = (s) => String(s || '').replace(/[_\s]+/g, '').toLowerCase();
      const tipeMatches = (filter, value) => {
        const f = normalizeValue(filter);
        const v = normalizeValue(value);
        if (!f) return true;
        if (f === v) return true;
        // groups of common equivalents for tipe
        const groups = {
          dp: ['dp', 'downpayment', 'down_payment', 'dp_bayar'],
          pelunasan: ['pelunasan', 'lunas', 'full', 'fullpayment'],
          belum_bayar: ['belum_bayar', 'belumbayar', 'unpaid']
        };
        for (const [k, arr] of Object.entries(groups)) {
          if (f === normalizeValue(k) && arr.map(normalizeValue).includes(v)) return true;
          if (v === normalizeValue(k) && arr.map(normalizeValue).includes(f)) return true;
        }
        // substring fallback (e.g., 'dp' matches 'downpayment')
        if (v.includes(f) || f.includes(v)) return true;
        return false;
      }
      if (tokens.tipe) { if (!tipeMatches(tokens.tipe, rowTipeVal)) return false; }
      if (!tokens.tipe && externalFilters && (externalFilters.tipe || externalFilters.type)) {
        const tf = String(externalFilters.tipe || externalFilters.type || '').trim().toLowerCase();
        if (tf && !tipeMatches(tf, rowTipeVal)) return false;
      }
  // status filter removed — server-side status filtering is not used on this page
      if (tokens.amtMin != null) { const amt = Number(row.nominal || row.amount || 0) || 0; if (amt < tokens.amtMin) return false; }
      if (tokens.amtMax != null) { const amt = Number(row.nominal || row.amount || 0) || 0; if (amt > tokens.amtMax) return false; }

  // removed statusFilter from client-side checks
    if (tipeFilter) { if (!tipeMatches(tipeFilter, rowTipeVal)) return false; }
      if (noTransaksiFilter) { const tx = (row.no_transaksi || row.Order?.no_transaksi || ''); if (!tx.toLowerCase().includes(noTransaksiFilter.toLowerCase())) return false; }
      if (customerFilter) { const name = (row.Customer?.nama || row.customer_name || row.customer || ''); if (!name.toLowerCase().includes(customerFilter.toLowerCase())) return false; }
      if (noHpFilter) { const phone = (row.no_hp || row.Customer?.no_hp || row.customer_phone || ''); if (!phone.toLowerCase().includes(noHpFilter.toLowerCase())) return false; }
      if (dateFrom) { const t = row.tanggal ? new Date(row.tanggal) : null; if (!t) return false; const from = new Date(dateFrom); if (t < from) return false; }
      if (dateTo) { const t = row.tanggal ? new Date(row.tanggal) : null; if (!t) return false; const to = new Date(dateTo); to.setHours(23,59,59,999); if (t > to) return false; }
      if (hasBukti) { const has = !!(row.bukti || row.bukti_url || row.proof); if (hasBukti === 'yes' && !has) return false; if (hasBukti === 'no' && has) return false; }
      if (nominalMin != null) { const amt = Number(row.nominal || row.amount || 0); if (amt < nominalMin) return false; }
      if (nominalMax != null) { const amt = Number(row.nominal || row.amount || 0); if (amt > nominalMax) return false; }

      if (q) {
        // Note: do not include Order.* values in search haystack to avoid matching order fields when filtering payments
        const hay = `${row.no_transaksi || ''} ${row.tipe || ''} ${row.reference || row.referensi || ''} ${row.Customer?.nama || ''} ${row.Customer?.no_hp || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // After filtering, apply client-side sorting based on table settings
    const sorted = (() => {
      try {
        const key = sortConfig.key;
        const dir = sortConfig.direction === 'desc' ? -1 : 1;
        if (!key) return res;
        const copy = res.slice();
        copy.sort((a, b) => {
          const va = a[key] != null ? a[key] : (a[key] === 0 ? 0 : '');
          const vb = b[key] != null ? b[key] : (b[key] === 0 ? 0 : '');
          // numeric compare
          const na = typeof va === 'number' ? va : (Number(String(va).replace(/[^0-9.-]+/g, '')) || String(va));
          const nb = typeof vb === 'number' ? vb : (Number(String(vb).replace(/[^0-9.-]+/g, '')) || String(vb));
          if (typeof na === 'number' && typeof nb === 'number' && !Number.isNaN(na) && !Number.isNaN(nb)) {
            return (na - nb) * dir;
          }
          const sa = String(va || '').toLowerCase();
          const sb = String(vb || '').toLowerCase();
          if (sa < sb) return -1 * dir;
          if (sa > sb) return 1 * dir;
          return 0;
        });
        return copy;
      } catch (err) { return res; }
    })();

    return sorted;
  }, [data, searchQuery, tipeFilter, noTransaksiFilter, customerFilter, noHpFilter, nominalMin, nominalMax, dateFrom, dateTo, hasBukti, externalFilters]);

  const handleDelete = useCallback((id) => setDeleteConfirm({ open: true, id }), []);
  const confirmDelete = () => {
    const id = deleteConfirm.id; setDeleteConfirm({ open: false, id: null }); if (!id) return;
    deletePayment(id).then(() => { showNotification('Payment deleted successfully', 'success'); reloadPayments(); }).catch((err) => { showNotification('Failed to delete payment', 'error'); console.error(err); });
  };

  const handleVerify = useCallback((id) => {
    setVerifyDialog({ open: true, id, form: { nominal: '', no_transaksi: '' } });
    setVerifyFormLocal({ nominal: '', no_transaksi: '', bukti: '' });
    setVerifyLoading(true);
    return getPaymentById(id).then((res) => {
      const p = res?.data || res || {};
      const initialNoTrans = p.no_transaksi || p.transaksi || p.reference || '';
      setVerifyDialog((s) => ({ ...s, form: { nominal: p.nominal || p.amount || '', no_transaksi: initialNoTrans, bukti: p.bukti || p.bukti_url || p.proof || '' } }));
      setVerifyFormLocal({ nominal: p.nominal || p.amount || '', no_transaksi: initialNoTrans, bukti: p.bukti || p.bukti_url || p.proof || '' });
      setDetailsMap((prev) => ({ ...prev, [id]: p }));
      // Try to prefill customer name from payment payload first
      let customerPhone = p.no_hp || p.Customer?.no_hp || '';
      let customerName = p.Customer?.nama || p.customer_name || p.nama || '';
      const tx = initialNoTrans;
      if (tx) {
        return Promise.all([getOrderByTransaksi(tx).catch(() => null), getPaymentsByTransaksi(tx).catch(() => null)])
            .then(async ([orderRes, payRes]) => {
            const ord = orderRes?.data || orderRes || {};
            const paymentsArr = payRes?.data?.data || payRes?.data || payRes || [];
            const orderTotalBayar = Number(ord.total_bayar || ord.total || ord.total_harga || 0) || 0;
            const total = orderTotalBayar;
            const orderDpBayar = Number(ord.dp_bayar || ord.dp || 0) || 0;
            const paid = Array.isArray(paymentsArr) ? paymentsArr.reduce((acc, it) => acc + (Number(it.nominal || it.amount || 0) || 0), 0) : 0;
            let remaining = 0;
            if (total && (orderDpBayar || orderDpBayar === 0)) remaining = total - orderDpBayar; else remaining = Math.max(0, total - paid);
            remaining = Math.max(0, remaining);
            const suggestedStatus = nominalCompareSuggestion(Number(p.nominal || p.amount || 0), remaining);
            // prefer order-provided customer name if available
            if (!customerName) customerName = ord.nama || ord.nama_customer || ord.customer_name || '';
            if (!customerPhone) customerPhone = ord.no_hp || ord.no_hp_customer || '';
            if (!customerName && customerPhone) {
              try {
                const cRes = await getCustomersByPhone(customerPhone);
                const c = cRes?.data?.data || cRes?.data || cRes || {};
                if (Array.isArray(c) && c.length > 0) customerName = c[0].nama || c[0].name || '';
                else if (c && c.nama) customerName = c.nama || c.name || '';
              } catch (err) { console.error('Failed to fetch customer by phone in verify flow', err); }
            }
            const type = (paid === 0) ? 'belum_bayar' : (paid < total ? 'dp' : 'lunas');
            setVerifySuggested({ remaining, suggestedStatus, total, paid, customerName, customerPhone, type });
            setVerifyImageError(false);
          })
          .catch((err) => { console.error(err); setVerifySuggested({ remaining: null, suggestedStatus: '', total: null, paid: null, customerName: '', customerPhone: '', type: '' }); });
      }
      return null;
    }).catch((err) => { console.error('Failed to load payment details for verify modal', err); }).finally(() => setVerifyLoading(false));
  }, []);

  const nominalCompareSuggestion = (nominal, remaining) => {
    if (remaining == null) return '';
    if (nominal >= remaining) return 'approved';
    if (nominal > 0 && nominal < remaining) return 'pending';
    return '';
  };

  const handleVerifyClose = () => { setVerifyDialog({ open: false, id: null, form: {} }); setVerifyFormLocal({}); };

  const confirmVerify = async () => {
    const id = verifyDialog.id;
    const nominal = Number(verifyFormLocal.nominal || 0);
    if (!id) return;
    if (!nominal || nominal <= 0) { showNotification('Nominal harus lebih besar dari 0', 'error'); return; }
    setVerifyLoading(true);
    try {
      const paymentsApi = await import('../api/payments');
      if (paymentsApi && paymentsApi.approvePaymentNominal) {
        await paymentsApi.approvePaymentNominal(id, nominal);
      } else if (paymentsApi && paymentsApi.approvePayment) {
        await paymentsApi.approvePayment(id, { nominal });
      } else if (paymentsApi && paymentsApi.verifyPayment) {
        await paymentsApi.verifyPayment(id, { nominal });
      } else {
        throw new Error('No verify API available');
      }
      showNotification('Payment verified/approved successfully', 'success');
      handleVerifyClose(); reloadPayments();
    } catch (err) {
      console.error('Failed to approve/verify payment', err);
      // Build a helpful message: include HTTP status and a short preview of response body when available
      const status = err?.response?.status;
      const body = err?.response?.data;
      let serverMsg = err?.message || 'Failed to verify payment';
      if (status) serverMsg = `Request failed: ${status} - ${serverMsg}`;
      try {
        if (body) {
          const preview = typeof body === 'string' ? body : JSON.stringify(body);
          serverMsg += ` (${preview.slice(0, 200)})`;
        }
      } catch (e) {
        // ignore
      }
      showNotification(serverMsg, 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleExpandWithDetails = useCallback((id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!detailsMap[id] && !detailsLoading[id]) {
      setDetailsLoading((prev) => ({ ...prev, [id]: true }));
      getPaymentById(id).then((res) => { setDetailsMap((prev) => ({ ...prev, [id]: res?.data || res })); }).catch((err) => { console.error(`Failed to load details for payment ${id}`, err); setDetailsMap((prev) => ({ ...prev, [id]: null })); }).finally(() => { setDetailsLoading((prev) => ({ ...prev, [id]: false })); });
    }
  }, [expanded, detailsMap, detailsLoading]);

  // Map keys to cells (copied/adapted)
  const renderTableCell = React.useCallback((key, r, align = 'left', rowIndex = null) => {
    const id = r.id_payment || r.id;
    const sanitizePhone = (p) => (String(p || '').replace(/\D/g, ''));
    const formatCurrency = (val) => (val == null || val === '') ? '-' : `Rp ${Number(val).toLocaleString('id-ID')}`;

    switch (key) {
      case 'id': return <TableCell align={align}>{id}</TableCell>;
      case 'no': return <TableCell align={align}>{rowIndex != null ? (rowIndex + 1) : '-'}</TableCell>;
      case 'orderNo': return <TableCell align={align}>{r.no_transaksi || r.Order?.no_transaksi || '-'}</TableCell>;
      case 'orderId': return <TableCell align={align}>{r.Order?.id_order || r.orderId || r.id_order || '-'}</TableCell>;
      case 'amount': return <TableCell align={align}>{formatCurrency(r.nominal)}</TableCell>;
      case 'idCustomer': return <TableCell align={align}>{r.id_customer || r.idCustomer || '-'}</TableCell>;
      case 'customerPhone': {
        const phoneVal = r.no_hp || r.phone || r.Customer?.no_hp || '';
        const s = sanitizePhone(phoneVal);
        return (<TableCell align={align}>{phoneVal ? <a href={`https://wa.me/${s}`} target="_blank" rel="noreferrer">{phoneVal}</a> : '-'}</TableCell>);
      }
      case 'customerName': return <TableCell align={align}>{r.Customer?.nama || r.nama || r.customer_name || r.name || '-'}</TableCell>;
      case 'date': return <TableCell align={align}>{r.tanggal ? new Date(r.tanggal).toLocaleString() : '-'}</TableCell>;
      case 'items': return <TableCell align={align}>{r.tipe || '-'}</TableCell>;
      case 'tipe': {
        const label = (r.tipe || '-');
        const map = { dp: 'warning', pelunasan: 'success' };
        const color = map[(r.tipe || '').toLowerCase()] || 'default';
        return (<TableCell align={align}><Chip label={String(label)} size="small" color={color} /></TableCell>);
      }
      case 'linkInvoice': {
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
        const label = r.status ? String(r.status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-';
        let statusColor = 'default';
        if (s === 'pending') statusColor = 'default';
        else if (s === 'menunggu_verifikasi' || s === 'menunggu') statusColor = 'warning';
        else if (['verified', 'confirmed', 'approved'].includes(s)) statusColor = 'success';
        else if (s === 'rejected') statusColor = 'error';
        return (<TableCell align={align}><Chip label={label} size="small" color={statusColor} /></TableCell>);
      }
      case 'actions': {
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
      default: return <TableCell align={align}>{r[key] ?? '-'}</TableCell>;
    }
  }, [handleExpandWithDetails, handleOpen, handleDelete, handleVerify]);

  const rows = React.useMemo(() => filteredData.map((row, idx) => (
    <PaymentRow
      key={row.id_payment || row.id}
      rowIndex={idx}
      row={row}
      expanded={expanded}
      detailsLoading={detailsLoading}
      detailsMap={detailsMap}
      visibleColumns={visibleColumns}
      renderTableCell={(k, r, a, i) => renderTableCell(k, r, a, i)}
    />
  )), [filteredData, expanded, detailsLoading, detailsMap, visibleColumns, renderTableCell]);

  // filter option arrays intentionally removed to avoid unused-variable lint warnings

  return (
    <Box>
      {/* filters are provided by the AppMainToolbar; status control was removed to avoid duplication */}
      {progress > 0 && (
        <Box sx={{ width: '100%', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
          <Box sx={{ minWidth: 120, textAlign: 'right' }}>
            <Typography variant="body2">{loadedCount ?? 0}{totalCount != null ? ` / ${totalCount}` : ''} — {totalCount ? `${Math.round(((loadedCount||0) / Math.max(1, totalCount)) * 100)}%` : `${progress}%`}</Typography>
          </Box>
        </Box>
      )}

      <TableContainer className="table-responsive" sx={{ maxHeight: 'clamp(40vh, calc(100vh - var(--header-height) - 160px), 75vh)', overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {visibleColumns.map((col) => {
                if (col.sortable) {
                  const isActive = sortConfig.key === col.key;
                  const direction = isActive ? sortConfig.direction : 'asc';
                  return (
                    <TableCell key={`hdr-${col.key}`} align={col.align}>
                      <Tooltip title={`Sort by ${col.label || col.key}`}>
                        <TableSortLabel active={isActive} direction={direction} onClick={() => handleSort(col.key)}>
                          {col.label || col.key}
                        </TableSortLabel>
                      </Tooltip>
                    </TableCell>
                  );
                }
                return <TableCell key={`hdr-${col.key}`} align={col.align}>{col.label || col.key}</TableCell>;
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow><TableCell colSpan={visibleColumns.length}><Typography>{data.length === 0 ? 'No payments found' : 'No payments match current filters'}</Typography></TableCell></TableRow>
            ) : rows}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Payment Dialog (kept local to this component) */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id_payment || form.id ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
        <DialogContent>
          {verifyLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}><CircularProgress /></Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField label="Transaction Number" name="no_transaksi" value={form.no_transaksi || ''} onChange={handleChange} error={!!errors.no_transaksi} helperText={errors.no_transaksi} fullWidth />
              <TextField label="Amount" name="nominal" type="number" value={form.nominal || form.amount || ''} onChange={handleChange} error={!!errors.nominal} helperText={errors.nominal} fullWidth />
              <TextField label="Payment Method" name="payment_method" select value={form.payment_method || form.metode_bayar || ''} onChange={handleChange} fullWidth>
                <MenuItem value="">Select Method</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="transfer">Bank Transfer</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="e_wallet">E-Wallet</MenuItem>
              </TextField>
              <TextField label="Reference" name="reference" value={form.reference || form.referensi || ''} onChange={handleChange} fullWidth />
              <TextField label="Notes" name="notes" value={form.notes || form.catatan || ''} onChange={handleChange} multiline rows={3} fullWidth />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this payment?</Typography></DialogContent>
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
            <TextField label="Transaction No" name="no_transaksi" value={verifyFormLocal.no_transaksi || ''} onChange={(e) => setVerifyFormLocal((s) => ({ ...s, no_transaksi: e.target.value }))} fullWidth />
            <TextField label="Nominal to approve" name="nominal" type="number" value={verifyFormLocal.nominal || ''} onChange={(e) => setVerifyFormLocal((s) => ({ ...s, nominal: e.target.value }))} fullWidth />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField label="Bukti (link)" name="bukti" value={verifyFormLocal.bukti || detailsMap[verifyDialog.id]?.bukti || ''} onChange={(e) => { setVerifyFormLocal((s) => ({ ...s, bukti: e.target.value })); setVerifyImageError(false); }} fullWidth />
              <Button size="small" disabled={!((verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || '').trim())} onClick={() => { const url = (verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || '').trim(); if (!url) return; setVerifyImagePreviewUrl(url); setVerifyImageOpen(true); }}>Preview</Button>
              <Button size="small" disabled={!((verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || '').trim())} onClick={() => { const url = (verifyDialog.form.bukti || detailsMap[verifyDialog.id]?.bukti || '').trim(); if (!url) return; window.open(url, '_blank'); }}>Open</Button>
            </Box>
            {(verifySuggested.total != null || (verifyDialog.id && detailsMap[verifyDialog.id])) && (
              <Box sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                <Typography variant="body2"><strong>Nama Customer:</strong> {verifySuggested.customerName || '-'}</Typography>
                <Typography variant="body2"><strong>No HP:</strong> {verifySuggested.customerPhone || detailsMap[verifyDialog.id]?.no_hp || '-'}</Typography>
                <Typography variant="body2"><strong>Total Pesanan:</strong> Rp {Number(verifySuggested.total || 0).toLocaleString('id-ID')}</Typography>
                <Typography variant="body2"><strong>Total Dibayar:</strong> Rp {Number(verifySuggested.paid || 0).toLocaleString('id-ID')}</Typography>
                <Typography variant="body2"><strong>Sisa yang harus dibayar:</strong> Rp {Number(verifySuggested.remaining || 0).toLocaleString('id-ID')}</Typography>
                <Typography variant="body2"><strong>Type:</strong> {verifySuggested.type || detailsMap[verifyDialog.id]?.tipe || '-'}</Typography>
                {verifySuggested.suggestedStatus && (<Typography variant="body2" sx={{ mt: 0.5 }}>Suggested status: <strong>{verifySuggested.suggestedStatus}</strong></Typography>)}
              </Box>
            )}
            {verifyDialog.id && detailsMap[verifyDialog.id] && (() => {
              const d = detailsMap[verifyDialog.id];
              const url = d.bukti || d.bukti_url || d.proof || d.file || d.image || d.attachment || d.bukti_transfer || d.proof_url;
              if (!url) return null;
              return (
                <Box>
                  <Typography variant="subtitle2">Preview bukti</Typography>
                  <Box sx={{ mt: 1, mb: 1, minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: verifyImageError ? 'action.hover' : 'transparent', borderRadius: 1, p: 1 }}>
                    {!verifyImageError ? (
                      <img src={url} alt="bukti" style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 8, cursor: 'pointer' }} onError={() => setVerifyImageError(true)} onClick={() => { setVerifyImagePreviewUrl(url); setVerifyImageOpen(true); }} />
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

      {/* Large image preview dialog */}
      <Dialog open={verifyImageOpen} onClose={() => setVerifyImageOpen(false)} maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Bukti Preview
          <IconButton size="small" onClick={() => setVerifyImageOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {verifyImagePreviewUrl ? (<Box sx={{ display: 'flex', justifyContent: 'center' }}><img src={verifyImagePreviewUrl} alt="bukti-large" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} /></Box>) : (<Typography>No image available</Typography>)}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
