import React from 'react';





export default function StatCard({ title, value, icon, color = 'bg-blue-500' }) {
  // Map tailwind color to accent
  const accentMap = {
    'bg-yellow-400': '#fbbf24',
    'bg-blue-400': '#3b82f6',
    'bg-pink-400': '#f472b6',
    'bg-cyan-400': '#06b6d4',
    'bg-green-400': '#059669',
    'bg-purple-400': '#8b5cf6',
    'bg-blue-500': '#3b82f6',
  };
  const accent = accentMap[color] || '#3b82f6';
  return (
    <div
      className="flex flex-col justify-between relative group"
      style={{
        background: '#232946',
        borderRadius: 28,
        minHeight: 120,
        padding: '24px 20px',
        boxShadow: `0 0 16px 0 ${accent}55, 0 2px 12px #232946cc`,
        fontFamily: 'Poppins, Inter, Arial, sans-serif',
        transition: 'box-shadow 0.2s, transform 0.2s',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 32px 0 ${accent}99, 0 4px 24px #232946cc`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 16px 0 ${accent}55, 0 2px 12px #232946cc`}
    >
      <div style={{ zIndex: 2, position: 'relative' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: 0.5, opacity: 0.92 }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: accent, letterSpacing: 1, marginTop: 6, textShadow: `0 2px 8px ${accent}55` }}>{value}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 8,
          fontSize: 64,
          color: accent,
          opacity: 0.13,
          zIndex: 1,
          pointerEvents: 'none',
          filter: `blur(0.5px)`
        }}
      >
        {icon}
      </div>
    </div>
  );
}
