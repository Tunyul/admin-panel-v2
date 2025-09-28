Theme token system

Overview
- Central theme tokens are defined in `src/theme/themes.js`.
- Use `applyTheme` from `src/theme/themeUtils.js` to write tokens to the document at runtime.
- Use the React hook `src/hooks/useTheme.js` to toggle theme and change tokens from components.

Quick examples

- Toggle theme from any component:
  import useTheme from '../hooks/useTheme';
  const { toggleTheme } = useTheme();
  toggleTheme();

- Change a single token (e.g., accent color at runtime):
  const { setToken } = useTheme();
  // update root token used by both light/dark or call with target 'dark' to update dark CSS block
  setToken('--accent', '#ff6b6b');

- Apply a set of tokens (light and dark variants):
  const { setTokens } = useTheme();
  setTokens({ light: { '--accent': '#ff6b6b' }, dark: { '--accent': '#ff8a8a' } });

- Reset to default tokens:
  const { reset } = useTheme();
  reset();

Notes
- Font family is controlled via `--font-primary` in the token set; update it to change fonts across the app.
- The theme store will apply tokens during initialization so the UI doesn't flash.
- For persistent user overrides, you can extend the store to save overrides to localStorage and reapply on init.
