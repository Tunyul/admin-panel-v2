import React from 'react';
import StatCardHeader from './StatCardHeader';
import StatCardIcon from './StatCardIcon';





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
        borderRadius: 18,
        height: 140,
        padding: '18px 16px',
  boxShadow: `0 4px 12px 0 ${accent}22, 0 2px 6px #00000055`,
        fontFamily: 'Poppins, Inter, Arial, sans-serif',
        transition: 'box-shadow 0.18s, transform 0.18s',
        border: '1px solid rgba(255,255,255,0.02)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px 0 ${accent}33, 0 4px 12px #00000066`; e.currentTarget.style.transform = 'translateY(-6px)'; }}
  onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 4px 12px 0 ${accent}22, 0 2px 6px #00000055`; e.currentTarget.style.transform = 'none'; }}
    >
      <StatCardHeader title={title} accent={accent} />

      <div style={{ fontSize: 30, fontWeight: 900, color: accent, letterSpacing: 1, marginTop: 8, textShadow: `0 2px 8px ${accent}33`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>

      <StatCardIcon icon={icon} accent={accent} />
    </div>
  );
}
