import { useCallback } from 'react';
import useThemeStore from '../store/themeStore';
import { applyTheme, updateToken } from '../theme/themeUtils';
import { lightTokens, darkTokens } from '../theme/themes';

// Simple hook to expose theme actions to components
export default function useTheme() {
  const darkMode = useThemeStore((s) => s.darkMode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const setOverrides = useThemeStore((s) => s.setOverrides);
  const resetOverrides = useThemeStore((s) => s.resetOverrides);

  const setToken = useCallback((key, value, opts = { target: 'root' }) => {
    updateToken(key, value, { target: opts.target });
  }, []);

  const setTokens = useCallback((tokens = {}, overrides = {}) => {
    // apply merged tokens and persist overrides if needed
    const merged = { light: { ...lightTokens, ...(tokens.light || {}) }, dark: { ...darkTokens, ...(tokens.dark || {}) } };
    applyTheme({ light: merged.light, dark: merged.dark, overrides });
    // persist overrides using store helper so subsequent loads reapply them
    if (setOverrides) setOverrides(overrides);
  }, [setOverrides]);

  const reset = useCallback(() => {
    applyTheme({ light: lightTokens, dark: darkTokens });
    if (resetOverrides) resetOverrides();
  }, [resetOverrides]);

  return {
    darkMode,
    toggleTheme,
    setToken,
    setTokens,
    reset,
    setOverrides,
    resetOverrides,
  };
}
