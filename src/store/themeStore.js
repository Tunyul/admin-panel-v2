import { create } from 'zustand';

const useThemeStore = create((set) => ({
  darkMode: true,
  toggleTheme: () => set((state) => ({ darkMode: !state.darkMode })),
  setTheme: (value) => set({ darkMode: value }),
}));

export default useThemeStore;
