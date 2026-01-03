import React, { useState } from "react";
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
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

// Dashboard 2 – Bar Chart
const subscriptionData = [
  { month: "Jan", subs: 40 },
  { month: "Feb", subs: 35 },
  { month: "Mar", subs: 25 },
  { month: "Apr", subs: 20 },
  { month: "May", subs: 30 },
  { month: "Jun", subs: 28 },
];

// Dashboard 3 – Pie Chart
const categoryData = [
  { name: "Science", value: 400 },
  { name: "Health", value: 300 },
  { name: "Engineering", value: 250 },
  { name: "Business", value: 200 },
];

const colors = ["#1f6feb", "#34c759", "#fbc02d", "#ef5350"];

// Fake Chat Box inside sidebar
function ChatBox() {
  return (
    <div className="p-4 bg-white shadow rounded-lg mt-6">
      <h3 className="font-semibold text-gray-700 mb-2">Live Chat Support</h3>
      <div className="text-sm text-gray-500">
        This is where your chat UI will go.
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <AdminLayout header="Serial Subscription Tracking System" sidebarExtra={<ChatBox />}>
      <Head title="Admin Dashboard" />

      <div className="space-y-6">

        {/* TEXT INTRO */}
        <p className="text-gray-500">
          Welcome back! Here’s what’s happening with your account approvals
        </p>

        {/* STAT CARDS */}
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
                <path d="M20 6L9 17l-5-5" stroke="#3C8A6B" strokeWidth="2" />
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
                <path d="M12 6v6l4 2" stroke="#C8A93C" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* AREA CHART */}
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
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f6feb" stopOpacity={0.9} />
                    <stop offset="60%" stopColor="#1f6feb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1f6feb" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6eefb" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#1f6feb"
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ================================ */}
        {/* DASHBOARD 2 + 3 SIDE BY SIDE     */}
        {/* ================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* BAR CHART */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Monthly Subscriptions
            </h3>

            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subscriptionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eefb" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="subs" fill="#1f6feb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PIE CHART */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Category Distribution
            </h3>

            <div style={{ height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ================================= */}
        {/*           INCOMING TABLE          */}
        {/* ================================= */}
        <div className="bg-white rounded-2xl p-6 shadow-md overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              New Account Approval
            </h3>
            <div className="text-sm text-gray-500">VoguePh • 06.20.2025</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Contact</th>
                  <th className="px-6 py-3 text-left">Date</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">Vol 2</td>
                  <td className="px-6 py-4 text-sm">0027-8424</td>
                  <td className="px-6 py-4 text-sm">
                    Proceedings of the National Academy of Sciences
                  </td>
                  <td className="px-6 py-4 text-sm">20.09.2025</td>
                </tr>

                <tr className="bg-blue-50 hover:bg-blue-100">
                  <td className="px-6 py-4 text-sm">Vol 1</td>
                  <td className="px-6 py-4 text-sm">0042-9686</td>
                  <td className="px-6 py-4 text-sm">
                    Bulletin of the World Health Organization
                  </td>
                  <td className="px-6 py-4 text-sm">19.09.2025</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
