import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';

export default function InvoicePreviewDialog({ open, onClose, imgSrc, onDownload }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Preview Invoice</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          {imgSrc ? <img src={imgSrc} alt="invoice preview" style={{ width: '100%', height: 'auto' }} /> : <div>Loading preview...</div>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onDownload}>Download PDF</Button>
      </DialogActions>
    </Dialog>
  );
}
