export default function MoonIcon({ moving, gone }) {
  let style = {
    position: 'absolute',
    left: 12,
    transition: 'left 2s cubic-bezier(.4,0,.2,1), opacity 0.2s',
    opacity: gone ? 0 : 1,
  };
  if (moving) {
    style.left = 'calc(100% - 44px)';
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
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffbe8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <path
        d="M24 25c-5.5 0-10-4.5-10-10 0-2.7 1.1-5.2 3-7-0.2 0-0.4 0-0.6 0C10.5 8 6 12.5 6 18c0 5.5 4.5 10 10 10 5.5 0 10-4.5 10-10 0-0.2 0-0.4 0-0.6-1.8 1.9-4.3 3-7 3z"
        fill="url(#moonGlow)"
        stroke="#fbbf24"
        strokeWidth="1.2"
      />
      <circle cx="22" cy="13" r="1.2" fill="#fffbe8" opacity="0.7" />
      <circle cx="18" cy="20" r="0.7" fill="#fffbe8" opacity="0.5" />
    </svg>
  );
}
