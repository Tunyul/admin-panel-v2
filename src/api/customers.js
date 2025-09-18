import client from './client';
import * as crud from './crudutils';

const CUSTOMERS_URL = '/api/customers';

export const getCustomers = crud.getAll(client, CUSTOMERS_URL);
export const getCustomerById = crud.getById(client, CUSTOMERS_URL);
export const createCustomer = crud.create(client, CUSTOMERS_URL);
export const updateCustomer = crud.update(client, CUSTOMERS_URL);
export const deleteCustomer = crud.remove(client, CUSTOMERS_URL);

// Custom endpoints (placeholders)
export const getCustomersByPhone = (phone) => client.get(`${CUSTOMERS_URL}/phone/${phone}`);

export default {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomersByPhone,
};
