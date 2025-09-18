import React from 'react';

export default function StatCardIcon({ icon, accent, size = 44 }) {
  return (
    <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 1, pointerEvents: 'none' }}>
      <div style={{ fontSize: size, color: accent, opacity: 0.8, filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.55))' }}>{icon}</div>
    </div>
  );
}
