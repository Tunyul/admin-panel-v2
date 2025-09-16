import { create } from 'zustand';

const useThemeStore = create((set) => ({
  darkMode: false,
  toggleTheme: () => set((state) => ({ darkMode: !state.darkMode })),
  setTheme: (value) => set({ darkMode: value }),
}));

export default useThemeStore;
