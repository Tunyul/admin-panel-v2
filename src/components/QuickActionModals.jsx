import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, CircularProgress } from '@mui/material';
import { getCustomers } from '../api/customers';
import { getProducts } from '../api/products';
import { createCustomer } from '../api/customers';
import { createOrder } from '../api/orders';
import { createPayment } from '../api/payments';

export default function QuickActionModals({ onNotify = () => {}, onSuccess = () => {} }) {
  const [openNewOrder, setOpenNewOrder] = useState(false);
  const [openAddCustomer, setOpenAddCustomer] = useState(false);
  const [openRecordPayment, setOpenRecordPayment] = useState(false);

  // New Order form state
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderProduct, setOrderProduct] = useState('');
  const [orderQty, setOrderQty] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add Customer form state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');

  // Record Payment form state (user-facing label will be 'Verif Payment')
  const [payOrderId, setPayOrderId] = useState('');
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    if (openNewOrder) {
      setLoadingLists(true);
      Promise.all([getCustomers().then(r => r.data?.data || r.data || []), getProducts().then(r => r.data?.data || r.data || [])])
        .then(([cs, ps]) => { setCustomers(cs); setProducts(ps); })
        .catch(() => onNotify('Failed to load customers or products', 'error'))
        .finally(() => setLoadingLists(false));
    }
  // onNotify is a stable callback passed from parent in our usage; intentionally omit it from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNewOrder]);

  const handleCreateOrder = async () => {
    if (!orderCustomer || !orderProduct) return onNotify('Customer and product are required', 'error');
    setSubmitting(true);
    try {
      await createOrder({ customer_id: orderCustomer, product_id: orderProduct, quantity: orderQty });
      onNotify('Order created', 'success');
      onSuccess();
      setOpenNewOrder(false);
      setOrderCustomer(''); setOrderProduct(''); setOrderQty(1);
    } catch {
      onNotify('Failed to create order', 'error');
    } finally { setSubmitting(false); }
  };

  const handleAddCustomer = async () => {
    if (!custName) return onNotify('Name is required', 'error');
    setSubmitting(true);
    try {
      await createCustomer({ name: custName, phone: custPhone });
      onNotify('Customer added', 'success');
      onSuccess();
      setOpenAddCustomer(false);
      setCustName(''); setCustPhone('');
    } catch {
      onNotify('Failed to add customer', 'error');
    } finally { setSubmitting(false); }
  };

  const handleRecordPayment = async () => {
    if (!payOrderId || !payAmount) return onNotify('Order ID and amount are required', 'error');
    setSubmitting(true);
    try {
      await createPayment({ order_id: payOrderId, amount: Number(payAmount) });
      onNotify('Payment verified', 'success');
      onSuccess();
      setOpenRecordPayment(false);
      setPayOrderId(''); setPayAmount('');
    } catch {
      onNotify('Failed to verify payment', 'error');
    } finally { setSubmitting(false); }
  };

  return (
    <>
      {/* New Order Dialog */}
      <Dialog open={openNewOrder} onClose={() => setOpenNewOrder(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Order</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {loadingLists ? <CircularProgress /> : (
              <>
                <TextField select label="Customer" value={orderCustomer} onChange={(e) => setOrderCustomer(e.target.value)}>
                  {customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name || c.username || `#${c.id}`}</MenuItem>)}
                </TextField>
                <TextField select label="Product" value={orderProduct} onChange={(e) => setOrderProduct(e.target.value)}>
                  {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.name || p.title || `#${p.id}`}</MenuItem>)}
                </TextField>
                <TextField type="number" label="Quantity" value={orderQty} onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value || 1)))} />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewOrder(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleCreateOrder} disabled={submitting || loadingLists}>{submitting ? 'Creating…' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={openAddCustomer} onClose={() => setOpenAddCustomer(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Customer</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={custName} onChange={(e) => setCustName(e.target.value)} />
            <TextField label="Phone" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddCustomer(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleAddCustomer} disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog (labelled 'Verif Payment') */}
      <Dialog open={openRecordPayment} onClose={() => setOpenRecordPayment(false)} fullWidth maxWidth="sm">
        <DialogTitle>Verif Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Order ID" value={payOrderId} onChange={(e) => setPayOrderId(e.target.value)} />
            <TextField label="Amount" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRecordPayment(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleRecordPayment} disabled={submitting}>{submitting ? 'Verifying…' : 'Verify'}</Button>
        </DialogActions>
      </Dialog>

      {/* Hidden controls to open modals from Dashboard buttons */}
      <div style={{ display: 'none' }}>
        <button id="qa-open-new-order" onClick={() => setOpenNewOrder(true)} />
        <button id="qa-open-add-customer" onClick={() => setOpenAddCustomer(true)} />
        <button id="qa-open-record-payment" onClick={() => setOpenRecordPayment(true)} />
      </div>
    </>
  );
}
