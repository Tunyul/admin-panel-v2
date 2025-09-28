import React, { useEffect, useState } from 'react';
import { Popover, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Button, Typography, Box } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckIcon from '@mui/icons-material/Check';
import useNotificationStore from '../store/notificationStore';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../api/notifications';

export default function NotificationsCenter({ open, onClose, anchorEl } = {}) {
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
  // backend may send parsed object under `body_parsed` or `data`/direct
  const data = res?.data?.body_parsed ?? res?.data?.data ?? res?.data ?? [];
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
              // ensure header badge reflects server count when list is empty
              setUnread(serverUnread);
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
    // optimistic update: mark all locally first, then call API
    const prevItems = items;
    try {
      // update local store immediately (mark read)
      setItemsStore((prev) => (Array.isArray(prev) ? prev.map((i) => ({ ...i, read: true })) : []));
      setUnread(0);
      // call backend
      await markAllAsRead();
      // on success, clear UI list (user intent is to remove/acknowledge notifications)
      useNotificationStore.getState().clearItems && useNotificationStore.getState().clearItems();
    } catch {
      // rollback to previous items and recompute unread
      setItemsStore(Array.isArray(prevItems) ? prevItems : []);
      const prevUnread = (Array.isArray(prevItems) ? prevItems : []).filter((n) => !n.read).length;
      setUnread(prevUnread);
      // ignore further
    }
  };

  // server-side unread count to help explain mismatch between icon badge and empty list
  const [serverUnread, setServerUnread] = useState(0);

  return (
    <Popover
      open={Boolean(open)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{ sx: { width: 360, maxWidth: '90%' } }}
    >
      {/* limit height so popover won't extend too far down; make content scrollable */}
      {/* Use column flex so header/footer keep their size and the List can scroll */}
      <Box sx={{ p: 1, minWidth: 280, maxHeight: 320, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Notifikasi</Typography>
          <Button size="small" startIcon={<DoneAllIcon />} onClick={handleMarkAll}>Mark all read</Button>
        </Box>

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
                  const data = res?.data?.body_parsed ?? res?.data?.data ?? res?.data ?? [];
                  setItemsStore(Array.isArray(data) ? data : []);
                  const unread2 = (Array.isArray(data) ? data : []).filter((n) => !n.read).length;
                  setUnread(unread2);
                } catch {
                  // ignore
                } finally {
                  setLoading(false);
                }
              })();
            }}>Refresh</Button>
          </Box>
        )}
  <List sx={{ overflowY: 'auto', flex: '1 1 auto' }}>
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
      </Box>
    </Popover>
  );
}
