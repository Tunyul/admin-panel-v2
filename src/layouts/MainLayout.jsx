import React from 'react';
import Sidebar from '../components/Sidebar';
import ThemeSwitcher from '../components/ThemeSwitcher';

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-darkbg">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex justify-end mb-4">
          <ThemeSwitcher />
        </div>
        {children}
      </main>
    </div>
  );
}
