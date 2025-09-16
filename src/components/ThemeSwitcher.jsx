import React from 'react';
import { Switch } from '@mui/material';
import useThemeStore from '../store/themeStore';

export default function ThemeSwitcher() {
  const { darkMode, toggleTheme } = useThemeStore();

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-700 dark:text-gray-300">Light</span>
      <Switch checked={darkMode} onChange={toggleTheme} />
      <span className="text-gray-700 dark:text-gray-300">Dark</span>
    </div>
  );
}
