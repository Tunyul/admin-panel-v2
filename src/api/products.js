import client from './client';
import * as crud from './crudutils';

const PRODUCTS_URL = '/api/products';

export const getProducts = crud.getAll(client, PRODUCTS_URL);
export const getProductById = crud.getById(client, PRODUCTS_URL);
export const createProduct = crud.create(client, PRODUCTS_URL);
export const updateProduct = crud.update(client, PRODUCTS_URL);
export const deleteProduct = crud.remove(client, PRODUCTS_URL);

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
