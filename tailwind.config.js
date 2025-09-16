/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkbg: '#18181b',
        darkpanel: '#23232b',
        darksoft: '#1e293b',
        neonYellow: '#fde047',
        neonBlue: '#3b82f6',
        neonPink: '#f472b6',
        neonCyan: '#22d3ee',
        softWhite: '#f3f4f6',
        softGray: '#e5e7eb',
        borderSoft: '#374151',
      },
      boxShadow: {
        neon: '0 0 8px 2px #3b82f6, 0 0 4px 1px #fde047',
        soft: '0 2px 16px 0 #23232b',
      },
      borderRadius: {
        xl: '1.25rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
};
