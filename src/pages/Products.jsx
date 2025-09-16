import React, { useState } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableHead, TableRow, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import useNotificationStore from '../store/notificationStore';

const initialData = [
  { id: 1, name: 'Product A', price: 100 },
  { id: 2, name: 'Product B', price: 200 },
];

export default function Products() {
  const [data, setData] = useState(initialData);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', price: '' });
  const { showNotification } = useNotificationStore();

  const handleOpen = (item = { id: null, name: '', price: '' }) => {
    setForm(item);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = () => {
    if (!form.name || !form.price) return;
    if (form.id) {
      setData(data.map((d) => (d.id === form.id ? form : d)));
      showNotification('Product updated!', 'success');
    } else {
      setData([...data, { ...form, id: Date.now() }]);
      showNotification('Product added!', 'success');
    }
    handleClose();
  };
  const handleDelete = (id) => {
    setData(data.filter((d) => d.id !== id));
    showNotification('Product deleted!', 'info');
  };

  return (
    <div className="bg-[#23232b] dark:bg-[#23232b] rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-100">Products</h2>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Product</Button>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className="text-gray-400">Name</TableCell>
            <TableCell className="text-gray-400">Price</TableCell>
            <TableCell className="text-gray-400">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-gray-200">{row.name}</TableCell>
              <TableCell className="text-gray-200">{row.price}</TableCell>
              <TableCell>
                <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
                <IconButton color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{form.id ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="name" label="Name" type="text" fullWidth value={form.name} onChange={handleChange} />
          <TextField margin="dense" name="price" label="Price" type="number" fullWidth value={form.price} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
