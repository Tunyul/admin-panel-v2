import client from './client';
import * as crud from './crudutils';

const ORDERS_URL = '/api/orders';

export const getOrders = crud.getAll(client, ORDERS_URL);
export const getOrderById = crud.getById(client, ORDERS_URL);
export const createOrder = crud.create(client, ORDERS_URL);
export const updateOrder = crud.update(client, ORDERS_URL);
export const deleteOrder = crud.remove(client, ORDERS_URL);

// Custom endpoint
export const getOrderByTransaksi = (no_transaksi) => client.get(`${ORDERS_URL}/transaksi/${no_transaksi}`, { headers: { bot: 'true' } });
export const updateStatusBot = (no_transaksi, data) => client.put(`${ORDERS_URL}/transaksi/${no_transaksi}/status-bot`, data);
export const updateOrderDetailByTransaksi = (no_transaksi, data) => client.put(`${ORDERS_URL}/transaksi/${no_transaksi}/orderDetail`, data);
export const getOrdersByCustomerPhone = (phone) => client.get(`${ORDERS_URL}/customer/phone/${phone}`);
export const getTotalByCustomerId = (customerId) => client.get(`${ORDERS_URL}/customer/${customerId}/total`);
export const getTotalByCustomerPhone = (phone) => client.get(`${ORDERS_URL}/customer/phone/${phone}/total`);
