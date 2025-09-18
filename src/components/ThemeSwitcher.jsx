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
						background: darkMode
							? 'linear-gradient(270deg, #fffbe8 10%, #fbbf24 100%)'
							: 'linear-gradient(90deg, #232946 10%, #f472b6 100%)',
						boxShadow: darkMode
							? '0 0 6px 2px #fbbf24cc, 0 0 0 1px #fde68a'
							: '0 0 6px 2px #f472b6cc, 0 0 0 1px #232946',
					},
					{
						background: darkMode
							? 'linear-gradient(90deg, #232946 10%, #f472b6 100%)'
							: 'linear-gradient(270deg, #fffbe8 10%, #fbbf24 100%)',
						boxShadow: darkMode
							? '0 0 6px 2px #f472b6cc, 0 0 0 1px #232946'
							: '0 0 6px 2px #fbbf24cc, 0 0 0 1px #fde68a',
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
					? '0 0 6px 2px #f472b6cc, 0 0 0 1px #232946'
					: '0 0 6px 2px #fbbf24cc, 0 0 0 1px #fde68a',
				background: darkMode
					? 'linear-gradient(90deg, #232946 10%, #f472b6 100%)'
					: 'linear-gradient(270deg, #fffbe8 10%, #fbbf24 100%)',
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
