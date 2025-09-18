import React from 'react';

export default function StatCardHeader({ title, accent }) {
  return (
    <div style={{ zIndex: 2, position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: 0.5, opacity: 0.98, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        </div>
        <div style={{ height: 6, width: 36, borderRadius: 6, background: accent, opacity: 0.9 }} />
      </div>
    </div>
  );
}
