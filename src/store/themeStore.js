import { create } from 'zustand';

// Helper: safely read persisted preference or system preference
const getInitialDark = () => {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true; // fallback
};

const applyDocumentClass = (isDark) => {
  try {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', Boolean(isDark));
    }
  } catch {
    // ignore
  }
};

const initialDark = getInitialDark();
// Apply immediately so UI doesn't flash
applyDocumentClass(initialDark);

const useThemeStore = create((set) => ({
  darkMode: initialDark,
  toggleTheme: () =>
    set((state) => {
      const next = !state.darkMode;
      applyDocumentClass(next);
      try {
        localStorage.setItem('theme', next ? 'dark' : 'light');
      } catch {
        // ignore
      }
      return { darkMode: next };
    }),
  setTheme: (value) =>
    set(() => {
      const val = Boolean(value);
      applyDocumentClass(val);
      try {
        localStorage.setItem('theme', val ? 'dark' : 'light');
      } catch {
        // ignore
      }
      return { darkMode: val };
    }),
}));

export default useThemeStore;
