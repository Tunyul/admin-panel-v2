import React from 'react';

export default function SunIcon({ moving, gone }) {
	let style = {
		position: 'absolute',
		right: 12,
		transition: 'right 2s cubic-bezier(.4,0,.2,1), opacity 0.2s',
		opacity: gone ? 0 : 1,
	};
	if (moving) {
		style.right = 'calc(100% - 44px)';
	}
	return (
		<svg
			width="32"
			height="32"
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			style={style}
		>
			<circle cx="16" cy="16" r="8" fill="#fffbe8" stroke="#fbbf24" strokeWidth="2" />
			<g stroke="#fbbf24" strokeWidth="2" strokeLinecap="round">
				<line x1="16" y1="3" x2="16" y2="8" />
				<line x1="16" y1="24" x2="16" y2="29" />
				<line x1="3" y1="16" x2="8" y2="16" />
				<line x1="24" y1="16" x2="29" y2="16" />
				<line x1="7.2" y1="7.2" x2="10.7" y2="10.7" />
				<line x1="21.3" y1="21.3" x2="24.8" y2="24.8" />
				<line x1="7.2" y1="24.8" x2="10.7" y2="21.3" />
				<line x1="21.3" y1="10.7" x2="24.8" y2="7.2" />
			</g>
		</svg>
	);
}
