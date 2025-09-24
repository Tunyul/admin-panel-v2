// Global page and table settings used across list pages
// Extracted from Orders page/table to keep configuration centralized.

const ordersPage = {
  id: 'orders',
  title: 'Orders',
  // default table settings
  table: {
    minWidth: 1100,
    defaultPageSize: 25,
    columns: [
      { key: 'no_transaksi', label: 'No Transaksi' },
      { key: 'customer', label: 'Customer' },
      { key: 'phone', label: 'Phone' },
      { key: 'tanggal_order', label: 'Tanggal Order' },
      { key: 'status_urgensi', label: 'Status Urgensi' },
      { key: 'total_bayar', label: 'Total Bayar' },
      { key: 'status_bayar', label: 'Status Bayar' },
      { key: 'tanggal_jatuh_tempo', label: 'Jatuh Tempo' },
      { key: 'status_order', label: 'Status Order' },
      { key: 'status', label: 'Status' },
      { key: 'dibayar', label: 'Dibayar' },
      { key: 'actions', label: 'Aksi', align: 'right', nowrap: true },
    ],
  },
  filters: {
    defaultSearch: '',
    defaultStatus: '',
    defaultStatusBayar: '',
  },
};

export default {
  orders: ordersPage,
};
