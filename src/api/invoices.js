import client from './client';

const base = '/api/invoices';

// Basic helpers
export const createInvoice = (payload) => client.post(base, payload);
export const getInvoiceByToken = (token) => client.get(`${base}/token/${encodeURIComponent(token)}`);
export const getInvoiceByTransaksi = (noTransaksi) => client.get(`${base}/by-transaksi/${encodeURIComponent(noTransaksi)}`);

export default {
  createInvoice,
  getInvoiceByToken,
  getInvoiceByTransaksi,
};
