import { create } from 'zustand';
import { applyTheme } from '../theme/themeUtils';
import { lightTokens, darkTokens } from '../theme/themes';

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

// Read persisted token overrides from localStorage (if any)
const getPersistedOverrides = () => {
  try {
    const raw = localStorage.getItem('theme-overrides');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const applyDocumentClass = (isDark, overrides = {}) => {
  try {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', Boolean(isDark));
      // Apply token values for both light and dark scopes.
      applyTheme({ light: lightTokens, dark: darkTokens, overrides });
    }
  } catch {
    // ignore
  }
};

const initialDark = getInitialDark();
const initialOverrides = getPersistedOverrides();
// Apply immediately so UI doesn't flash
applyDocumentClass(initialDark, initialOverrides);

const useThemeStore = create((set) => ({
  darkMode: initialDark,
  toggleTheme: () =>
    set((state) => {
      const next = !state.darkMode;
      applyDocumentClass(next, state.overrides || {});
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
      applyDocumentClass(val, {});
      try {
        localStorage.setItem('theme', val ? 'dark' : 'light');
      } catch {
        // ignore
      }
      return { darkMode: val };
    }),
  // overrides is an object: { light: { '--accent': '#...' }, dark: { '--accent': '#...' } }
  overrides: initialOverrides,
  setOverrides: (overrides) =>
    set((state) => {
      const next = overrides || {};
      try {
        localStorage.setItem('theme-overrides', JSON.stringify(next));
      } catch {
        // ignore
      }
      // re-apply theme tokens with overrides
      applyDocumentClass(state.darkMode, next);
      return { overrides: next };
    }),
  resetOverrides: () =>
    set((state) => {
      try {
        localStorage.removeItem('theme-overrides');
      } catch {
        // ignore
      }
      applyDocumentClass(state.darkMode, {});
      return { overrides: {} };
    }),
}));

export default useThemeStore;
