import React from 'react';

export default function Header() {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-[#232946] border-b border-[#fbbf24] shadow-md">
      <h1 className="text-2xl font-bold text-[#fbbf24] tracking-wide" style={{ fontFamily: 'Quicksand, Poppins, Arial, sans-serif' }}>
        CS Bot Admin
      </h1>
      <div className="flex items-center gap-4">
      </div>
    </header>
  );
}
