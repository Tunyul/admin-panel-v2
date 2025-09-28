import React from 'react';
import { render, screen } from '@testing-library/react';
import OrdersTableHead from '../OrdersTableHead';

describe('OrdersTableHead', () => {
  it('renders provided column labels', () => {
    const cols = [{ key: 'a', label: 'Col A' }, { key: 'b', label: 'Col B' }];
    render(<table><thead><OrdersTableHead columns={cols} /></thead></table>);
    expect(screen.getByText('Col A')).toBeTruthy();
    expect(screen.getByText('Col B')).toBeTruthy();
  });
});
