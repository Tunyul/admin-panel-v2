import React, { useState } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableHead, TableRow, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import useNotificationStore from '../store/notificationStore';

const initialData = [
  { id: 1, orderNo: 'ORD001', customer: 'John Doe', total: 500 },
  { id: 2, orderNo: 'ORD002', customer: 'Jane Smith', total: 300 },
];

export default function Orders() {
  const [data, setData] = useState(initialData);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: null, orderNo: '', customer: '', total: '' });
  const { showNotification } = useNotificationStore();

  const handleOpen = (item = { id: null, orderNo: '', customer: '', total: '' }) => {
    setForm(item);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = () => {
    if (!form.orderNo || !form.customer || !form.total) return;
    if (form.id) {
      setData(data.map((d) => (d.id === form.id ? form : d)));
      showNotification('Order updated!', 'success');
    } else {
      setData([...data, { ...form, id: Date.now() }]);
      showNotification('Order added!', 'success');
    }
    handleClose();
  };
  const handleDelete = (id) => {
    setData(data.filter((d) => d.id !== id));
    showNotification('Order deleted!', 'info');
  };

  return (
    <div className="bg-[#23232b] dark:bg-[#23232b] rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-100">Orders</h2>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Order</Button>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className="text-gray-400">Order No</TableCell>
            <TableCell className="text-gray-400">Customer</TableCell>
            <TableCell className="text-gray-400">Total</TableCell>
            <TableCell className="text-gray-400">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-gray-200">{row.orderNo}</TableCell>
              <TableCell className="text-gray-200">{row.customer}</TableCell>
              <TableCell className="text-gray-200">{row.total}</TableCell>
              <TableCell>
                <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
                <IconButton color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{form.id ? 'Edit Order' : 'Add Order'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="orderNo" label="Order No" type="text" fullWidth value={form.orderNo} onChange={handleChange} />
          <TextField margin="dense" name="customer" label="Customer" type="text" fullWidth value={form.customer} onChange={handleChange} />
          <TextField margin="dense" name="total" label="Total" type="number" fullWidth value={form.total} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
