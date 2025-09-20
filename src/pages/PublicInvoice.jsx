import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Typography, Button, Chip, Divider } from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getOrderByTransaksi } from '../api/orders';
import { getOrderDetailsByOrderId } from '../api/orderDetail';
import { getPaymentsByTransaksi } from '../api/payments';
import { getCustomerById } from '../api/customers';
import InvoiceToolbar from '../components/invoice/InvoiceToolbar';
import InvoiceItems from '../components/invoice/InvoiceItems';
import InvoiceSummary from '../components/invoice/InvoiceSummary';
import InvoicePayments from '../components/invoice/InvoicePayments';
import InvoicePreviewDialog from '../components/invoice/InvoicePreviewDialog';

export default function PublicInvoice() {
  const params = useParams();
  // Support both /invoice/:no_transaksi and /invoice/token/:token
  const no_transaksi = params.no_transaksi || null;
  const token = params.token || null;
  const staticPayload = params.payload || null; // /invoice/static/:payload
  
  const [order, setOrder] = useState(null);
  const [details, setDetails] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  // progress: track steps completed out of total (order, details, payments, customer)
  const [progressSteps, setProgressSteps] = useState({ done: 0, total: 4 });

  // Preview state (declare hooks unconditionally)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  // debug panel removed in finalization

  useEffect(() => {
    // If token is present, try token endpoint first
    const fetchByToken = async (tk) => {
      try {
        setLoading(true);
        const res = await fetch(`/api/invoices/token/${encodeURIComponent(tk)}`);
        if (!res.ok) throw new Error('token not found');
        const payload = await res.json();
        const d = payload?.data || {};
        const normalized = normalizeInvoicePayload({ order: d.order || d, details: d.order_details || [], payments: d.payments || [] });
  setOrder(normalized.order);
  setDetails(normalized.details);
  setPayments(normalized.payments);
  setProgressSteps({ done: 4, total: 4 });
  return true;
      } catch {
        return false;
      } finally {
        setLoading(false);
      }
    };

    const fetchByTransaksi = async (tx) => {
      try {
        setLoading(true);
        setProgressSteps({ done: 0, total: 4 });
        const res = await getOrderByTransaksi(tx);
        const o = res?.data?.data || res?.data || null;
        setProgressSteps((s) => ({ ...s, done: s.done + 1 }));
        const rdetails = [];
        if (o) {
          const id = o?.id || o?.order_id || o?.id_order;
          if (id) {
            const r = await getOrderDetailsByOrderId(id);
            rdetails.push(...(r?.data?.data || r?.data || []));
            setProgressSteps((s) => ({ ...s, done: s.done + 1 }));
          }
        }
        // If backend returns OrderDetails nested in the order response, include them
        if (o && Array.isArray(o.OrderDetails) && o.OrderDetails.length > 0) {
          rdetails.push(...o.OrderDetails);
        }

        // If order has only id_customer, try to fetch customer info
        let customerObj = null;
        if (o && !o.customer && (o.id_customer || o.id_customer === 0)) {
          try {
            const cr = await getCustomerById(o.id_customer || o.id_customer);
            customerObj = cr?.data?.data || cr?.data || null;
          } catch {
            // ignore customer fetch failure
            customerObj = null;
          }
          if (customerObj) {
            // attach to order for normalization
            o.customer = customerObj;
          }
        }
        // mark customer step attempted (found or not)
        setProgressSteps((s) => ({ ...s, done: s.done + 1 }));
  const rp = await getPaymentsByTransaksi(tx);
  const rpayments = rp?.data?.data || rp?.data || [];
  setProgressSteps((s) => ({ ...s, done: s.done + 1 }));

        const normalized = normalizeInvoicePayload({ order: o, details: rdetails, payments: rpayments });
        setOrder(normalized.order);
        setDetails(normalized.details);
        setPayments(normalized.payments);
      } catch {
        setOrder(null);
        setDetails([]);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    (async () => {
      // if static payload present, decode and render
      if (staticPayload) {
        try {
          setLoading(true);
          const b = staticPayload.replace(/-/g, '+').replace(/_/g, '/');
          const json = decodeURIComponent(escape(window.atob(b)));
          const payload = JSON.parse(json);
          // normalize payload to increase compatibility with various shapes
          const normalized = normalizeInvoicePayload({ order: payload.order || null, details: payload.order_details || [], payments: payload.payments || [] });
          setOrder(normalized.order);
          setDetails(normalized.details);
          setPayments(normalized.payments);
          setProgressSteps({ done: 3, total: 3 });
          return;
        } catch {
          // invalid payload, continue to other flows
          console.error('Invalid static invoice payload');
        } finally {
          setLoading(false);
        }
      }
      if (token) {
        const ok = await fetchByToken(token);
        if (ok) return;
        // fallback: token not found -> show expired message (handled below)
      }
      if (no_transaksi) {
        await fetchByTransaksi(no_transaksi);
      }
    })();
  }, [no_transaksi, token, staticPayload]);

  // Helper: normalize invoice shapes coming from different backends
  const coerceValue = (v) => {
    if (v == null) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'object') return v.name || v.nama || v.label || v.title || JSON.stringify(v);
    return String(v);
  };

  function normalizeInvoicePayload({ order = null, details = [], payments = [] }) {
    // copy to avoid mutating original
    const ord = order ? { ...order } : null;

  // use coerceValue directly

    // collect details from many possible locations
    let dets = Array.isArray(details) ? details.slice() : [];
    if ((!dets || dets.length === 0) && ord) {
      dets = ord.order_details || ord.order_items || ord.items || ord.products || ord.details || ord.line_items || ord.cart || ord.items_list || [];
    }
    if (!Array.isArray(dets)) dets = [];

    // normalize each detail item
    const normalizedDetails = dets.map((d) => {
      const item = d || {};
      // Support backend shape where product info is nested under Product
      const prod = item.Product || item.product || item.produk || item.item || null;
      const name = item.nama || item.name || item.product_name || item.title || item.label || item.sku || (prod && (prod.nama_produk || prod.name || prod.nama || prod.title)) || item.description || '-';
      const qty = Number(item.quantity ?? item.qty ?? item.jumlah ?? item.q ?? item.qty_purchased ?? item.amount ?? item.quantity ?? 1) || 1;
      const unit_price = Number(item.harga_satuan ?? item.harga ?? item.price ?? item.unit_price ?? item.unitPrice ?? item.amount_unit ?? (prod && (prod.harga_per_pcs || prod.harga_per_m2 || prod.price || prod.harga)) ?? item.produk?.harga ?? 0) || 0;
      return {
        // preserve raw for any future need
        _raw: item,
        name,
        qty,
        unit_price,
      };
    });

    // collect payments from common locations
    let pays = Array.isArray(payments) ? payments.slice() : [];
    if ((!pays || pays.length === 0) && ord) {
      pays = ord.payments || ord.payment_history || ord.pembayaran || ord.payments_list || [];
    }
    if (!Array.isArray(pays)) pays = [];

    const normalizedPayments = pays.map((p) => {
      const pay = p || {};
      return {
        _raw: pay,
        id: pay.id_payment || pay.id || pay.payment_id || pay.tx_id || null,
        tanggal: pay.tanggal || pay.created_at || pay.date || pay.paid_at || null,
        nominal: Number(pay.nominal ?? pay.amount ?? pay.value ?? 0) || 0,
      };
    });

    // normalize customer into order.customer and top-level name fields used elsewhere
    if (ord) {
      // create customer object if missing
      ord.customer = ord.customer || {};
      const detectedNameRaw = ord.customer?.name ?? ord.nama_customer ?? ord.customer_name ?? ord.nama ?? ord.name ?? ord.customer ?? null;
      const detectedPhoneRaw = ord.customer?.phone ?? ord.phone ?? ord.no_hp ?? ord.customer_phone ?? ord.telp ?? null;
      const detectedAddressRaw = ord.customer?.address ?? ord.address ?? ord.alamat ?? ord.customer_address ?? ord.alamat_pengiriman ?? null;

  const detectedName = coerceValue(detectedNameRaw);
  const detectedPhone = coerceValue(detectedPhoneRaw);
  const detectedAddress = coerceValue(detectedAddressRaw);

      if (!ord.customer || typeof ord.customer !== 'object') ord.customer = { name: detectedName };
  ord.customer.name = coerceValue(ord.customer.name) || detectedName;
  ord.customer.phone = coerceValue(ord.customer.phone) || detectedPhone;
  ord.customer.address = coerceValue(ord.customer.address) || detectedAddress;

      // also populate common top-level aliases so existing components pick them up
      ord.nama_customer = coerceValue(ord.nama_customer) || coerceValue(ord.customer_name) || coerceValue(ord.nama) || coerceValue(ord.name) || ord.customer?.name || detectedName || ord.nama_customer;
      ord.customer_name = coerceValue(ord.customer_name) || ord.nama_customer;
      ord.nama = coerceValue(ord.nama) || ord.nama_customer;
    }

    // For compatibility with existing components which expect harga/price fields inside details
    const detailsForUI = normalizedDetails.map((nd) => ({
      nama: nd.name,
      name: nd.name,
      quantity: nd.qty,
      qty: nd.qty,
      jumlah: nd.qty,
      harga: nd.unit_price,
      price: nd.unit_price,
      unit_price: nd.unit_price,
      _raw: nd._raw,
    }));

    // payments for UI
    const paymentsForUI = normalizedPayments.map((np) => ({
      id_payment: np.id,
      id: np.id,
      tanggal: np.tanggal,
      created_at: np.tanggal,
      nominal: np.nominal,
      amount: np.nominal,
      _raw: np._raw,
    }));

    // If customer is missing or contains an empty-object string like '{}', try to extract from payments raw payloads
    const looksLikeEmptyObjectString = (v) => typeof v === 'string' && v.trim() === '{}';
    if (ord) {
      const currentName = ord.customer?.name || ord.nama_customer || ord.customer_name || ord.nama;
      if (!currentName || looksLikeEmptyObjectString(currentName)) {
        // search payments raw payloads for nested Customer
        for (const p of paymentsForUI) {
          const raw = p._raw || {};
          const nested = raw.Customer || raw.customer || (raw.Order && raw.Order.Customer) || (raw.Order && raw.Order.Customer);
          if (nested) {
            const cn = coerceValue(nested.nama ?? nested.name ?? null);
            const cp = coerceValue(nested.no_hp ?? nested.phone ?? nested.nohp ?? null);
            if (cn) {
              ord.customer = ord.customer || {};
              ord.customer.name = cn;
              ord.customer.phone = ord.customer.phone || cp;
              ord.nama_customer = ord.nama_customer || cn;
              ord.customer_name = ord.customer_name || cn;
              ord.nama = ord.nama || cn;
              break;
            }
          }
        }
      }
    }

    return { order: ord, details: detailsForUI, payments: paymentsForUI };
  }

  const hasQuery = Boolean(no_transaksi || token || staticPayload);

  const totalOrder = order ? Number(order.total || order.total_bayar || order.jumlah || 0) : 0;
  const totalPayments = payments.reduce((s, p) => s + (Number(p.nominal || p.amount || 0) || 0), 0);
  const balance = totalOrder - totalPayments;

  // derive simplified payment status
  // - Lunas: balance <= 0
  // - DP: totalPayments > 0 and balance > 0
  // - Belum Bayar: totalPayments == 0
  const paymentStatus = (() => {
    if (!order) return 'unknown';
    if (balance <= 0) return 'lunas';
    if (totalPayments > 0) return 'dp';
    return 'belum_bayar';
  })();

  const statusLabel = paymentStatus === 'lunas' ? 'Lunas' : paymentStatus === 'dp' ? 'DP' : paymentStatus === 'belum_bayar' ? 'Belum Bayar' : 'Unknown';
  const statusColor = paymentStatus === 'lunas' ? 'success' : paymentStatus === 'dp' ? 'warning' : paymentStatus === 'belum_bayar' ? 'error' : 'default';

  const downloadPdf = async () => {
    // Try client-side PDF generation using html2canvas + jsPDF. Fallback to print on error.
    try {
      const el = document.getElementById('invoice-root');
      if (!el) return window.print();
      // hide interactive controls marked with .no-capture
      const noCaptureEls = Array.from(document.querySelectorAll('.no-capture'));
      const previousVis = noCaptureEls.map((n) => n.style.visibility || '');
      noCaptureEls.forEach((n) => { n.style.visibility = 'hidden'; });
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      // restore visibility
      noCaptureEls.forEach((n, i) => { n.style.visibility = previousVis[i]; });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      // If content fits one page, add and save. Otherwise add scaled image and allow PDF to crop (simple).
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${no_transaksi || 'invoice'}.pdf`);
    } catch (e) {
      console.error('PDF generation failed, falling back to print', e);
      window.print();
    }
  };

  const handlePreview = async () => {
    try {
      const el = document.getElementById('invoice-root');
      if (!el) return;
      // hide interactive controls marked with .no-capture during capture
      const noCaptureEls = Array.from(document.querySelectorAll('.no-capture'));
      const previousVis = noCaptureEls.map((n) => n.style.visibility || '');
      noCaptureEls.forEach((n) => { n.style.visibility = 'hidden'; });
      const canvas = await html2canvas(el, { scale: 1.5, useCORS: true });
      // restore visibility
      noCaptureEls.forEach((n, i) => { n.style.visibility = previousVis[i]; });
      const img = canvas.toDataURL('image/png');
      setPreviewImage(img);
      setPreviewOpen(true);
    } catch (e) {
      console.error('Preview generation failed', e);
    }
  };

  // debug logs removed


  return (
    <Box sx={{ p: { xs: 2, md: 6 }, bgcolor: '#f3f4f6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      {!hasQuery ? (
        <Box sx={{ p: 4 }}><Typography>No transaction specified.</Typography></Box>
      ) : (
        <Paper id="invoice-root" className="public-invoice-paper" sx={{ p: { xs: 3, md: 6 }, width: '100%', maxWidth: 920, mx: 'auto', bgcolor: '#ffffff !important', color: '#111827 !important', borderRadius: 2, boxShadow: '0 6px 30px rgba(2,6,23,0.08)' }}>
          {loading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="caption">Loading data ({progressSteps.done}/{progressSteps.total}) — {Math.round((progressSteps.done / Math.max(1, progressSteps.total)) * 100)}%</Typography>
              <LinearProgress variant="determinate" value={Math.round((progressSteps.done / Math.max(1, progressSteps.total)) * 100)} sx={{ height: 8, borderRadius: 2, mt: 1 }} />
            </Box>
          )}
          {
            // build a plain customer object for the toolbar to avoid rendering objects directly
            (() => {
              const cust = order?.customer || {};
              const customerForToolbar = {
                name: coerceValue(cust?.name) || coerceValue(order?.nama_customer) || coerceValue(order?.customer_name) || coerceValue(order?.nama) || '-',
                phone: coerceValue(cust?.phone) || coerceValue(order?.no_hp) || coerceValue(order?.phone) || '-',
                address: coerceValue(cust?.address) || coerceValue(order?.alamat) || '',
              };
              return <InvoiceToolbar noTransaksi={no_transaksi || order?.no_transaksi || order?.no_transaksi_lama || '-'} statusLabel={statusLabel} statusColor={statusColor} onDownload={downloadPdf} onPreview={handlePreview} customer={customerForToolbar} />;
            })()
          }
          {loading ? (
            <Typography>Loading...</Typography>
          ) : !order ? (
            <Typography color="error">Order not found for transaksi: {no_transaksi}</Typography>
          ) : (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontWeight: 700, mb: 1, color: '#111827' }}>{order?.customer?.name || order?.nama_customer || order?.customer_name || order?.nama || 'Customer'}</Typography>
              <InvoiceItems details={details} />
              <InvoiceSummary totalOrder={totalOrder} totalPayments={totalPayments} balance={balance} />
              <InvoicePayments payments={payments} />
              <InvoicePreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} imgSrc={previewImage} onDownload={() => { setPreviewOpen(false); downloadPdf(); }} />

              {/* debug panel removed */}
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}
