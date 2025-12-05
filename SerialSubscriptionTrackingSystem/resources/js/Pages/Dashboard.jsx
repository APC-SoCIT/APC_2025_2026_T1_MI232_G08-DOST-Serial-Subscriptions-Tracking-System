import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", value: 560 },
  { month: "Feb", value: 420 },
  { month: "Mar", value: 150 },
  { month: "Apr", value: 180 },
  { month: "May", value: 210 },
  { month: "Jun", value: 120 },
  { month: "Jul", value: 100 },
  { month: "Aug", value: 150 },
  { month: "Sep", value: 220 },
  { month: "Oct", value: 430 },
  { month: "Nov", value: 360 },
  { month: "Dec", value: 520 },
];

export default function Dashboard() {
  return (
    <AdminLayout header="Serial Subscription Tracking System">
      <Head title="Admin Dashboard" />

      <div className="space-y-6">
        <p className="text-gray-500">
          Welcome back! Here’s what’s happening with your account approvals
        </p>

        {/* stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="mt-2 text-3xl font-extrabold text-gray-900">156</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" fill="#8BB8DF" />
                <path d="M21 21a9 9 0 10-18 0" fill="#CDE6FA" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved Users</p>
              <p className="mt-2 text-3xl font-extrabold text-gray-900">89</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#3C8A6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Users</p>
              <p className="mt-2 text-3xl font-extrabold text-gray-900">45</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M12 6v6l4 2" stroke="#C8A93C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Serial Report area chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Serial Report</h3>
            <div className="text-sm text-blue-600 space-x-3">
              <button className="px-2 py-1 rounded-md hover:bg-blue-50">1W</button>
              <button className="px-2 py-1 rounded-md hover:bg-blue-50">1M</button>
              <button className="px-2 py-1 rounded-md hover:bg-blue-50">3M</button>
              <button className="px-2 py-1 rounded-md hover:bg-blue-50">1Y</button>
            </div>
          </div>

          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f6feb" stopOpacity={0.9} />
                    <stop offset="60%" stopColor="#1f6feb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1f6feb" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e6eefb"/>
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#1f6feb"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incoming table */}
        <div className="bg-white rounded-2xl p-6 shadow-md overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">New Account Approval</h3>
            <div className="text-sm text-gray-500">VoguePh • 06.20.2025</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">Vol 2</td>
                  <td className="px-6 py-4 text-sm text-gray-700">0027-8424</td>
                  <td className="px-6 py-4 text-sm text-gray-700">Proceedings of the National Academy of Sciences of the United States of America</td>
                  <td className="px-6 py-4 text-sm text-gray-700">20.09.2025</td>
                </tr>

                <tr className="bg-blue-50 hover:bg-blue-100">
                  <td className="px-6 py-4 text-sm text-gray-700">Vol 1</td>
                  <td className="px-6 py-4 text-sm text-gray-700">0042-9686</td>
                  <td className="px-6 py-4 text-sm text-gray-700">Bulletin of the World Health Organization</td>
                  <td className="px-6 py-4 text-sm text-gray-700">19.09.2025</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
