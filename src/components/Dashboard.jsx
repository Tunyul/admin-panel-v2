import React from 'react';
import StatCard from './StatCard';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PaymentIcon from '@mui/icons-material/Payment';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const stats = [
  { title: 'Customers', value: 1200, icon: <PeopleIcon />, color: 'bg-green-500' },
  { title: 'Products', value: 320, icon: <ShoppingCartIcon />, color: 'bg-yellow-500' },
  { title: 'Orders', value: 150, icon: <AssignmentIcon />, color: 'bg-purple-500' },
  { title: 'Piutangs', value: 50, icon: <AssignmentIcon />, color: 'bg-pink-500' },
  { title: 'Payments', value: 100, icon: <PaymentIcon />, color: 'bg-blue-500' },
];

const chartData = [
  { name: 'Mon', Orders: 30, Payments: 20 },
  { name: 'Tue', Orders: 20, Payments: 18 },
  { name: 'Wed', Orders: 27, Payments: 23 },
  { name: 'Thu', Orders: 25, Payments: 22 },
  { name: 'Fri', Orders: 32, Payments: 28 },
  { name: 'Sat', Orders: 40, Payments: 35 },
  { name: 'Sun', Orders: 38, Payments: 30 },
];

const activities = [
  { type: 'Bitcoin', time: '10:42:23 AM', status: 'Completed', amount: '+1545.00' },
  { type: 'Bitcoin', time: '10:42:23 AM', status: 'Completed', amount: '+1545.00' },
];

export default function Dashboard() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
      <div className="bg-[#23232b] dark:bg-[#23232b] rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-100">Market Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip contentStyle={{ background: '#23232b', color: '#fff', border: 'none' }} />
            <Line type="monotone" dataKey="Orders" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="Payments" stroke="#22d3ee" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-[#23232b] dark:bg-[#23232b] rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold mb-4 text-gray-100">Recent Activities</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400">
              <th>Type</th>
              <th>Time</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((act, idx) => (
              <tr key={idx} className="border-b border-gray-700 last:border-none">
                <td className="py-2 text-gray-200">{act.type}</td>
                <td className="py-2 text-gray-400">{act.time}</td>
                <td className="py-2 text-green-400">{act.status}</td>
                <td className="py-2 text-blue-400">{act.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
