import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Button, Typography, Box } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckIcon from '@mui/icons-material/Check';
import useNotificationStore from '../store/notificationStore';
import { getNotifications, markAsRead, markAllAsRead } from '../api/notifications';

export default function NotificationsCenter({ open, onClose } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setUnread, decrementUnread } = useNotificationStore();

  useEffect(() => {
    if (!open) return undefined;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getNotifications({ limit: 50 });
        const data = res?.data?.data || res?.data || [];
        if (!mounted) return;
        setItems(Array.isArray(data) ? data : []);
        const unread = (Array.isArray(data) ? data : []).filter((n) => !n.read).length;
        setUnread(unread);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, setUnread]);

  const handleMark = async (id, idx) => {
    try {
      await markAsRead(id);
      setItems((prev) => {
        const next = [...prev];
        if (next[idx]) next[idx] = { ...next[idx], read: true };
        return next;
      });
      decrementUnread(1);
    } catch {
      // ignore
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      setItems((prev) => prev.map((i) => ({ ...i, read: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  return (
    <Dialog open={Boolean(open)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Notifikasi
        <Box sx={{ float: 'right' }}>
          <Button size="small" startIcon={<DoneAllIcon />} onClick={handleMarkAll}>Mark all read</Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        {!loading && items.length === 0 && <Typography>Tidak ada notifikasi</Typography>}
        <List>
          {items.map((it, i) => (
            <ListItem key={it.id || `${it.no_transaksi}-${i}`} divider>
              <ListItemText primary={it.title || it.no_transaksi || it.message || 'Notifikasi'} secondary={it.message || it.status || it.timestamp} />
              <ListItemSecondaryAction>
                {!it.read && (
                  <IconButton edge="end" onClick={() => handleMark(it.id, i)} aria-label="mark-read">
                    <CheckIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
