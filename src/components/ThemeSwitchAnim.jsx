import React from 'react';
import MoonIcon from './ThemeSwitchMoon';
import SunIcon from './ThemeSwitchSun';
import useThemeStore from '../store/themeStore';

export default function ThemeSwitchAnim() {
  const { darkMode } = useThemeStore();
  return darkMode ? <MoonIcon /> : <SunIcon />;
}
