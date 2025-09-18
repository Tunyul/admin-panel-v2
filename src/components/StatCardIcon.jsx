import React from 'react';

export default function StatCardIcon({ icon, accent, size = 44 }) {
  return (
    <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 1, pointerEvents: 'none' }}>
      <div style={{ fontSize: size, color: accent, opacity: 0.9, filter: 'drop-shadow(0 8px 14px rgba(11,33,53,0.08))' }}>{icon}</div>
    </div>
  );
}
