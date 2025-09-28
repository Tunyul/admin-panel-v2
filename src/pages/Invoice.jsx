import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, MenuItem } from '@mui/material';
import { getCustomers } from '../api/customers';
import { getOrdersByCustomerPhone } from '../api/orders';
import { getOrderDetailsByOrderId } from '../api/orderDetail';
import { getPaymentsByCustomer, getPaymentsByTransaksi } from '../api/payments';
import useNotificationStore from '../store/notificationStore';

function currency(v) {
  if (v == null) return '-';
  return `Rp${Number(v).toLocaleString('id-ID')}`;
}

export default function Invoice() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orders, setOrders] = useState([]);
  const [orderDetailsMap, setOrderDetailsMap] = useState({});
  const [payments, setPayments] = useState([]);
  const { showNotification } = useNotificationStore();

  useEffect(() => {
    // load customers for selector (small page, ok to load all)
    getCustomers()
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        setCustomers(Array.isArray(items) ? items : []);
      })
      .catch(() => showNotification('Gagal memuat customers', 'error'));
  }, [showNotification]);

  useEffect(() => {
    if (!selectedCustomer) return;
    // selectedCustomer may be phone number or id depending on selector; try to interpret
    const byPhone = customers.find((c) => c.id === selectedCustomer || c.no_hp === selectedCustomer || String(c.id) === String(selectedCustomer));
    const phone = byPhone?.no_hp || selectedCustomer;

    // fetch orders by customer phone first (API helper exists)
    getOrdersByCustomerPhone(phone)
      .then((res) => {
        const items = res?.data?.data || res?.data || [];
        const arr = Array.isArray(items) ? items : [];
        setOrders(arr);
        // fetch order details for each order
        arr.forEach((o) => {
          getOrderDetailsByOrderId(o.id || o.order_id || o.id_order)
            .then((r) => {
              const det = r?.data?.data || r?.data || [];
              setOrderDetailsMap((s) => ({ ...s, [o.id || o.order_id || o.id_order]: Array.isArray(det) ? det : [] }));
            })
            .catch(() => setOrderDetailsMap((s) => ({ ...s, [o.id || o.order_id || o.id_order]: [] })));
        });
      })
      .catch(() => {
        setOrders([]);
        showNotification('Gagal memuat orders untuk customer', 'error');
      });

    // fetch payments by customer id if available, otherwise by phone using custom endpoint
    const cust = customers.find((c) => String(c.id) === String(selectedCustomer) || c.no_hp === selectedCustomer);
    if (cust && cust.id) {
      getPaymentsByCustomer(cust.id)
        .then((r) => setPayments(r?.data?.data || r?.data || []))
        .catch(() => setPayments([]));
    } else {
      getPaymentsByTransaksi(phone)
        .then((r) => setPayments(r?.data?.data || r?.data || []))
        .catch(() => setPayments([]));
    }
  }, [selectedCustomer, customers, showNotification]);

  const totalOrdersAmount = orders.reduce((acc, o) => acc + (Number(o.total || o.jumlah || o.total_amount || 0) || 0), 0);
  const totalPayments = payments.reduce((acc, p) => acc + (Number(p.nominal || 0) || 0), 0);
  const balance = totalOrdersAmount - totalPayments;

  const handlePrint = () => window.print();

  return (
    <Box className="main-card" sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ color: '#ffe066', fontWeight: 700, mb: 2 }}>Invoice (Customer Payments)</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          select
          label="Pilih Customer"
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          fullWidth
        >
          <MenuItem value="">(pilih customer)</MenuItem>
          {customers.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.nama || c.name || `${c.no_hp || c.phone} - ${c.nama || c.name || 'Customer'}`}</MenuItem>
          ))}
        </TextField>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography sx={{ fontWeight: 700, color: 'var(--accent-2)' }}>Summary</Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Box sx={{ flex: 1 }}><Typography>Total Orders: {currency(totalOrdersAmount)}</Typography></Box>
          <Box sx={{ flex: 1 }}><Typography>Total Payments: {currency(totalPayments)}</Typography></Box>
          <Box sx={{ flex: 1 }}><Typography>Balance: {currency(balance)}</Typography></Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography sx={{ fontWeight: 700, color: 'var(--accent-2)', mb: 1 }}>Orders</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>No Transaksi</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((o) => (
              <React.Fragment key={o.id || o.order_id}>
                <TableRow>
                  <TableCell>{o.id || o.order_id}</TableCell>
                  <TableCell>{o.no_transaksi || '-'}</TableCell>
                  <TableCell>{currency(o.total || o.jumlah || o.total_amount || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} sx={{ bgcolor: 'transparent', p: 1 }}>
                    <Typography variant="body2" sx={{ color: 'var(--muted)' }}>
                      Order details: {Array.isArray(orderDetailsMap[o.id || o.order_id]) ? orderDetailsMap[o.id || o.order_id].length : 0}
                      {Array.isArray(orderDetailsMap[o.id || o.order_id]) && orderDetailsMap[o.id || o.order_id].length > 0 ? (
                        <span> — {orderDetailsMap[o.id || o.order_id].map((d) => d.nama || d.product_name || d.name || d.sku || '-').slice(0,3).join(', ')}{orderDetailsMap[o.id || o.order_id].length > 3 ? '...' : ''}</span>
                      ) : null}
                    </Typography>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
            {orders.length === 0 && (
              <TableRow><TableCell colSpan={3} sx={{ color: 'var(--muted)' }}>No orders for selected customer.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography sx={{ fontWeight: 700, color: 'var(--accent-2)', mb: 1 }}>Payments</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tanggal</TableCell>
              <TableCell>Nominal</TableCell>
              <TableCell>No Transaksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id_payment || p.id}>
                <TableCell>{p.id_payment || p.id}</TableCell>
                <TableCell>{p.tanggal || '-'}</TableCell>
                <TableCell>{currency(p.nominal)}</TableCell>
                <TableCell>{p.no_transaksi || '-'}</TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && (
              <TableRow><TableCell colSpan={4} sx={{ color: 'var(--muted)' }}>No payments found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" sx={{ bgcolor: '#ffe066', color: 'var(--button-text)', fontWeight: 700 }} onClick={handlePrint}>Print Invoice</Button>
      </Box>
    </Box>
  );
}
