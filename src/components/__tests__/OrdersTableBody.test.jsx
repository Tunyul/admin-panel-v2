import React from 'react';
import { render, screen } from '@testing-library/react';
import OrdersTableBody from '../OrdersTableBody';

describe('OrdersTableBody', () => {
  it('shows empty message when no data', () => {
    render(<table><tbody><OrdersTableBody data={[]} columns={[]} /></tbody></table>);
    expect(screen.getByText(/Belum ada data order/i)).toBeTruthy();
  });
});
