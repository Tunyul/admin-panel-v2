import React from 'react';

export default function StatCard({ title, value, icon, color = 'bg-blue-500' }) {
  return (
    <div className={`flex items-center p-5 rounded-2xl shadow-lg bg-[#23232b] dark:bg-[#23232b] text-white relative overflow-hidden`}>
      <div className="mr-4">
        <div className={`w-12 h-12 flex items-center justify-center rounded-full ${color} bg-opacity-20 border border-gray-700 shadow-inner`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <div>
        <div className="text-base font-semibold text-gray-300">{title}</div>
        <div className="text-2xl font-bold text-white">{value}</div>
      </div>
      <div className="absolute right-4 top-4 opacity-20 text-5xl">{icon}</div>
    </div>
  );
}
