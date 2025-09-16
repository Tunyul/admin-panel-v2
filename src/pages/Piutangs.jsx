import React, { useState } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableHead, TableRow, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import useNotificationStore from '../store/notificationStore';

const initialData = [
  { id: 1, name: 'John Doe', amount: 1000 },
  { id: 2, name: 'Jane Smith', amount: 500 },
];

export default function Piutangs() {
  const [data, setData] = useState(initialData);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', amount: '' });
  const { showNotification } = useNotificationStore();

  const handleOpen = (item = { id: null, name: '', amount: '' }) => {
    setForm(item);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = () => {
    if (!form.name || !form.amount) return;
    if (form.id) {
      setData(data.map((d) => (d.id === form.id ? form : d)));
      showNotification('Piutang updated!', 'success');
    } else {
      setData([...data, { ...form, id: Date.now() }]);
      showNotification('Piutang added!', 'success');
    }
    handleClose();
  };
  const handleDelete = (id) => {
    setData(data.filter((d) => d.id !== id));
    showNotification('Piutang deleted!', 'info');
  };

  return (
    <div className="bg-[#23232b] dark:bg-[#23232b] rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-100">Piutangs</h2>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Piutang</Button>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className="text-gray-400">Name</TableCell>
            <TableCell className="text-gray-400">Amount</TableCell>
            <TableCell className="text-gray-400">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-gray-200">{row.name}</TableCell>
              <TableCell className="text-gray-200">{row.amount}</TableCell>
              <TableCell>
                <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
                <IconButton color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{form.id ? 'Edit Piutang' : 'Add Piutang'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="name" label="Name" type="text" fullWidth value={form.name} onChange={handleChange} />
          <TextField margin="dense" name="amount" label="Amount" type="number" fullWidth value={form.amount} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
