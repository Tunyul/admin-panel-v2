import client from './client';
import * as crud from './crudutils';

const base = '/api/payments';

export const getPayments = crud.getAll(client, base);
export const getPaymentById = crud.getById(client, base);
export const createPayment = crud.create(client, base);
export const updatePayment = crud.update(client, base);
export const deletePayment = crud.remove(client, base);

// The API docs expose PUT /api/payments/{id} to update a payment (use for verify)
export const verifyPayment = (id, data = {}) => client.put(`${base}/${id}`, data);

// Additional convenience endpoints per API docs
export const getPaymentsByOrder = (orderId) => client.get(`${base}/order/${orderId}`);
export const getPaymentsByCustomer = (customerId) => client.get(`${base}/customer/${customerId}`);
export const updateByTransaksi = (payload) => client.put(`${base}/update-by-transaksi`, payload);
export const updateByPhone = (payload) => client.put(`${base}/update-by-phone`, payload);

export default {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  verifyPayment,
  deletePayment,
  getPaymentsByOrder,
  getPaymentsByCustomer,
  updateByTransaksi,
  updateByPhone,
};
