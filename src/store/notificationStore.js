import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  open: false,
  message: '',
  severity: 'info',
  // lightweight unread counter for header badge
  unreadCount: 0,
  // stored list of notifications (FE-side cache)
  items: [],
  showNotification: (message, severity = 'info') => set({ open: true, message, severity }),
  closeNotification: () => set({ open: false, message: '', severity: 'info' }),
  // items helpers
  setItems: (arr) => set({ items: Array.isArray(arr) ? arr : [] }),
  prependItem: (it) => set((s) => ({ items: [it, ...(s.items || [])] })),
  markItemRead: (id) => set((s) => ({ items: (s.items || []).map((x) => (x.id === id ? { ...x, read: true } : x)) })),
  // unread helpers
  incrementUnread: (n = 1) => set((s) => ({ unreadCount: (s.unreadCount || 0) + n })),
  resetUnread: () => set({ unreadCount: 0 }),
  decrementUnread: (n = 1) => set((s) => ({ unreadCount: Math.max(0, (s.unreadCount || 0) - n) })),
  setUnread: (n = 0) => set({ unreadCount: n }),
}));

export default useNotificationStore;
