import client from './client';
import * as crud from './crudutils';

const base = '/api/payments';

export const getPayments = crud.getAll(client, base);
// Support fetching payments with query parameters (e.g. ?status=verified&tipe=dp)
export const getPaymentsWithParams = (params = {}) => {
  try { console.debug('[API][payments] getPaymentsWithParams params=', params); } catch {
    // ignore debug failure
  }
  return client.get(base, { params }).then((res) => {
    try { console.debug('[API][payments] response received, status=', res?.status, 'dataCount=', Array.isArray(res?.data?.data) ? res.data.data.length : (Array.isArray(res?.data) ? res.data.length : null)); } catch {
      // ignore debug failure
    }
    return res;
  });
};
export const getPaymentById = crud.getById(client, base);
export const createPayment = crud.create(client, base);
export const updatePayment = crud.update(client, base);
export const deletePayment = crud.remove(client, base);

// Some API variants accept a PUT /api/payments with id_payment in the body
// Use this to update/verify a payment by sending { id_payment, ... } in payload
export const updatePaymentByBody = (payload) => client.put(base, payload);

// The API docs expose PUT /api/payments/{id} to update a payment (use for verify)
export const verifyPayment = (id, data = {}) => client.put(`${base}/${id}`, data);

// Approve endpoint: PUT /api/payments/approve/:id
export const approvePayment = (id, data = {}) => client.put(`${base}/approve/${id}`, data);

// Convenience: approve with only nominal in body
export const approvePaymentNominal = (id, nominal) => approvePayment(id, { nominal });

// Additional convenience endpoints per API docs
export const getPaymentsByOrder = (orderId) => client.get(`${base}/order/${orderId}`);
export const getPaymentsByCustomer = (customerId) => client.get(`${base}/customer/${customerId}`);
export const updateByTransaksi = (payload) => client.put(`${base}/update-by-transaksi`, payload);
export const updateByPhone = (payload) => client.put(`${base}/update-by-phone`, payload);
// convenience: fetch payments by transaction number (no_transaksi)
export const getPaymentsByTransaksi = (transaksi) => client.get(`${base}/transaksi/${encodeURIComponent(transaksi)}`);

export default {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  updatePaymentByBody,
  verifyPayment,
  approvePayment,
  approvePaymentNominal,
  deletePayment,
  getPaymentsByOrder,
  getPaymentsByCustomer,
  updateByTransaksi,
  updateByPhone,
};
