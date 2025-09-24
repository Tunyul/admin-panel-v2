import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderRow from '../OrderRow';

const minimalRow = {
  id_order: 1,
  no_transaksi: 'TX001',
  customer: { nama: 'Budi', phone: '081234' },
  tanggal_order: new Date().toISOString(),
  total_bayar: 10000,
  status_bayar: 'lunas',
  status_order: 'proses',
  status: 'selesai',
};

describe('OrderRow', () => {
  it('renders basic fields', () => {
    render(<table><tbody><OrderRow row={minimalRow} expanded={null} detailsLoading={{}} onOpen={() => {}} onDelete={() => {}} onExpand={() => {}} onGenerateInvoice={() => {}} customersMap={{}} /></tbody></table>);
    expect(screen.getByText('TX001')).toBeTruthy();
    expect(screen.getByText('Budi')).toBeTruthy();
  });
});
