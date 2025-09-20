import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Button, Typography, Box } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckIcon from '@mui/icons-material/Check';
import useNotificationStore from '../store/notificationStore';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../api/notifications';

export default function NotificationsCenter({ open, onClose } = {}) {
  const items = useNotificationStore((s) => s.items || []);
  const setItemsStore = useNotificationStore((s) => s.setItems);
  const markItemRead = useNotificationStore((s) => s.markItemRead);
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
  const arr = Array.isArray(data) ? data : [];
  setItemsStore(arr);
        const unread = arr.filter((n) => !n.read).length;
        setUnread(unread);
        // If list is empty but server may still have unread count, fetch it to show helpful message
        if (arr.length === 0) {
          try {
            const r2 = await getUnreadCount();
            const serverUnread = r2?.data?.data?.unread ?? r2?.data?.unread ?? 0;
            if (serverUnread > 0) {
              setItemsStore([]);
              // keep unread in store but we'll surface serverUnread via local state so UI can show it
              setServerUnread(serverUnread);
            } else {
              setServerUnread(0);
            }
          } catch {
            setServerUnread(0);
          }
        } else {
          setServerUnread(0);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, setUnread, setItemsStore]);

  const handleMark = async (id) => {
    try {
      await markAsRead(id);
      markItemRead(id);
      decrementUnread(1);
    } catch {
      // ignore
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      setItemsStore((prev) => (Array.isArray(prev) ? prev.map((i) => ({ ...i, read: true })) : []));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  // server-side unread count to help explain mismatch between icon badge and empty list
  const [serverUnread, setServerUnread] = useState(0);

  return (
    <Dialog open={Boolean(open)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Notifikasi
        <Box sx={{ float: 'right' }}>
          <Button size="small" startIcon={<DoneAllIcon />} onClick={handleMarkAll}>Mark all read</Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        {!loading && items.length === 0 && serverUnread === 0 && <Typography>Tidak ada notifikasi</Typography>}
        {!loading && items.length === 0 && serverUnread > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
            <Typography>{`Terlihat kosong, tapi server melaporkan ${serverUnread} notifikasi belum dibaca.`}</Typography>
            <Button size="small" onClick={() => {
              // reopen/fetch
              (async () => {
                try {
                  setLoading(true);
                  const res = await getNotifications({ limit: 50 });
                  const data = res?.data?.data || res?.data || [];
                  setItemsStore(Array.isArray(data) ? data : []);
                } catch {
                  // ignore
                } finally {
                  setLoading(false);
                }
              })();
            }}>Refresh</Button>
          </Box>
        )}
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
