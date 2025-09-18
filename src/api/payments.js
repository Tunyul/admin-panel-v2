import client from './client';
import * as crud from './crudutils';

const base = '/api/payments';

export const getPayments = crud.getAll(client, base);
export const getPaymentById = crud.getById(client, base);
export const createPayment = crud.create(client, base);
export const updatePayment = crud.update(client, base);
export const deletePayment = crud.remove(client, base);

export default {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
};
