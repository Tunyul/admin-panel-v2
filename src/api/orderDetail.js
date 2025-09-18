import client from './client';
import * as crud from './crudutils';

const ORDER_DETAIL_URL = '/api/order-detail';

export const getOrderDetails = crud.getAll(client, ORDER_DETAIL_URL);
export const getOrderDetailById = crud.getById(client, ORDER_DETAIL_URL);
export const createOrderDetail = crud.create(client, ORDER_DETAIL_URL);
export const updateOrderDetail = crud.update(client, ORDER_DETAIL_URL);
export const deleteOrderDetail = crud.remove(client, ORDER_DETAIL_URL);

// Custom endpoint
export const getOrderDetailsByOrderId = (order_id) => client.get(`${ORDER_DETAIL_URL}/order/${order_id}`);
