import React, { useRef, useEffect } from 'react';
import useThemeStore from '../store/themeStore';
import ThemeSwitchAnim from './ThemeSwitchAnim';

// Accessible theme switcher — keyboard operable, announces state, uses store
export default function ThemeSwitcher() {
	const { darkMode, toggleTheme } = useThemeStore();
	const ref = useRef(null);

	useEffect(() => {
		if (ref.current && ref.current.animate) {
			ref.current.animate(
				[
					{
						background: getComputedStyle(document.documentElement).getPropertyValue('--gradient') || 'var(--gradient)',
						boxShadow: darkMode
							? '0 0 6px 2px rgba(var(--accent-2-rgb),0.18), 0 0 0 1px var(--border)'
							: '0 0 6px 2px rgba(var(--accent-rgb),0.18), 0 0 0 1px var(--border)',
					},
					{
						background: getComputedStyle(document.documentElement).getPropertyValue('--gradient') || 'var(--gradient)',
						boxShadow: darkMode
							? '0 0 6px 2px rgba(var(--accent-rgb),0.18), 0 0 0 1px var(--border)'
							: '0 0 6px 2px rgba(var(--accent-2-rgb),0.18), 0 0 0 1px var(--border)',
					},
				],
				{
					duration: 300,
					fill: 'forwards',
					easing: 'cubic-bezier(.4,0,.2,1)',
				}
			);
		}
	}, [darkMode]);

	return (
		<div
			ref={ref}
			role="switch"
			aria-checked={!!darkMode}
			tabIndex={0}
			onClick={toggleTheme}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					toggleTheme();
				}
			}}
			aria-label={darkMode ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}
			style={{
				width: 120,
				height: 50,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				borderRadius: 999,
				boxShadow: darkMode
					? '0 0 6px 2px rgba(var(--accent-rgb),0.18), 0 0 0 1px var(--border)'
					: '0 0 6px 2px rgba(var(--accent-2-rgb),0.18), 0 0 0 1px var(--border)',
				background: 'var(--gradient)',
				position: 'relative',
				overflow: 'hidden',
				cursor: 'pointer',
				userSelect: 'none',
				transition: 'none',
			}}
		>
			<ThemeSwitchAnim />
		</div>
	);
}
