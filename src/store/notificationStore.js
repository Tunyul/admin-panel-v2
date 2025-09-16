import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  open: false,
  message: '',
  severity: 'info',
  showNotification: (message, severity = 'info') => set({ open: true, message, severity }),
  closeNotification: () => set({ open: false, message: '', severity: 'info' }),
}));

export default useNotificationStore;
