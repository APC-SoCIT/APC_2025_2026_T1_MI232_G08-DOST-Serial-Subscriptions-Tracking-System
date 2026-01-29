import React, { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { Listbox } from "@headlessui/react";

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

const years = ["2022", "2023", "2024", "2025"];

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
// Account Status Distribution (renamed labels only)
const categoryData = [
  { name: "Approved", value: 400 },   // was Science
  { name: "Pending", value: 300 },    // was Health
  { name: "Rejected", value: 250 },   // was Engineering
  { name: "Disabled", value: 200 },   // was Business
];
// ===== ACCOUNT APPROVAL TREND (CHART DATA) =====
const approvalTrendData = [
  { year: "2022", approved: 45 },
  { year: "2023", approved: 78 },
  { year: "2024", approved: 112 },
  { year: "2025", approved: 156 },
];
// ===== SUPPLIER ACCOUNT CREATION (DERIVED FROM APPROVALS) =====
const supplierAccountData = approvalTrendData.map(item => ({
  year: item.year,
  suppliers: Math.round(item.approved * 0.9), // 90% of approved become suppliers
}));



// ===== ADMIN KPI DATA (YEARLY) =====
const yearlyUserStats = [
  { year: "2022", total: 156, approved: 45 },
  { year: "2023", total: 180, approved: 78 },
  { year: "2024", total: 210, approved: 112 },
  { year: "2025", total: 240, approved: 156 },
];

// Fixed system-wide total users
const TOTAL_USERS = 156;

// ===== MONTHLY APPROVAL DATA (SOURCE OF TRUTH) =====
const monthlyApprovalData = {
  "2022": [
    { month: "Jan", approved: 4 },
    { month: "Feb", approved: 5 },
    { month: "Mar", approved: 6 },
    { month: "Apr", approved: 7 },
    { month: "May", approved: 8 },
    { month: "Jun", approved: 7 },
    { month: "Jul", approved: 8 },
    { month: "Aug", approved: 9 },
    { month: "Sep", approved: 10 },
    { month: "Oct", approved: 11 },
    { month: "Nov", approved: 10 },
    { month: "Dec", approved: 10 },
  ],
  "2023": [
    { month: "Jan", approved: 6 },
    { month: "Feb", approved: 7 },
    { month: "Mar", approved: 8 },
    { month: "Apr", approved: 9 },
    { month: "May", approved: 10 },
    { month: "Jun", approved: 9 },
    { month: "Jul", approved: 10 },
    { month: "Aug", approved: 11 },
    { month: "Sep", approved: 12 },
    { month: "Oct", approved: 13 },
    { month: "Nov", approved: 11 },
    { month: "Dec", approved: 12 },
  ],
  "2024": [
    { month: "Jan", approved: 8 },
    { month: "Feb", approved: 9 },
    { month: "Mar", approved: 10 },
    { month: "Apr", approved: 11 },
    { month: "May", approved: 12 },
    { month: "Jun", approved: 11 },
    { month: "Jul", approved: 12 },
    { month: "Aug", approved: 13 },
    { month: "Sep", approved: 14 },
    { month: "Oct", approved: 15 },
    { month: "Nov", approved: 14 },
    { month: "Dec", approved: 13 },
  ],
  "2025": [
    { month: "Jan", approved: 12 },
    { month: "Feb", approved: 13 },
    { month: "Mar", approved: 14 },
    { month: "Apr", approved: 15 },
    { month: "May", approved: 16 },
    { month: "Jun", approved: 15 },
    { month: "Jul", approved: 16 },
    { month: "Aug", approved: 17 },
    { month: "Sep", approved: 18 },
    { month: "Oct", approved: 19 },
    { month: "Nov", approved: 18 },
    { month: "Dec", approved: 18 },
  ],
};

// ===== MONTHLY SUPPLIER DATA (DERIVED) =====
const monthlySupplierData = Object.fromEntries(
  Object.entries(monthlyApprovalData).map(([year, months]) => [
    year,
    months.map(m => ({
      month: m.month,
      suppliers: Math.round(m.approved * 0.4),
    })),
  ])
);
// ===== ACCOUNT STATUS DATA (PER YEAR) =====
const yearlyStatusData = {
  "2022": {
    approved: 45,
    pending: 30,
    rejected: 15,
    disabled: 10,
  },
  "2023": {
    approved: 78,
    pending: 40,
    rejected: 22,
    disabled: 15,
  },
  "2024": {
    approved: 112,
    pending: 55,
    rejected: 28,
    disabled: 15,
  },
  "2025": {
    approved: 156,
    pending: 84,
    rejected: 32,
    disabled: 18,
  },
};




// ===== YEAR-BASED MOCK DATA (ADMIN DASHBOARD) =====
const yearlyChartData = {
  "2022": {
    area: [
      { month: "Jan", value: 120 },
      { month: "Feb", value: 140 },
      { month: "Mar", value: 110 },
      { month: "Apr", value: 130 },
      { month: "May", value: 150 },
      { month: "Jun", value: 160 },
    ],
    bar: [
      { month: "Jan", subs: 10 },
      { month: "Feb", subs: 15 },
      { month: "Mar", subs: 12 },
      { month: "Apr", subs: 18 },
      { month: "May", subs: 20 },
      { month: "Jun", subs: 22 },
    ],
  },

  "2023": {
    area: [
      { month: "Jan", value: 180 },
      { month: "Feb", value: 200 },
      { month: "Mar", value: 170 },
      { month: "Apr", value: 190 },
      { month: "May", value: 220 },
      { month: "Jun", value: 240 },
    ],
    bar: [
      { month: "Jan", subs: 18 },
      { month: "Feb", subs: 22 },
      { month: "Mar", subs: 20 },
      { month: "Apr", subs: 25 },
      { month: "May", subs: 28 },
      { month: "Jun", subs: 30 },
    ],
  },

  "2024": {
    area: [
      { month: "Jan", value: 260 },
      { month: "Feb", value: 280 },
      { month: "Mar", value: 250 },
      { month: "Apr", value: 270 },
      { month: "May", value: 300 },
      { month: "Jun", value: 320 },
    ],
    bar: [
      { month: "Jan", subs: 25 },
      { month: "Feb", subs: 30 },
      { month: "Mar", subs: 28 },
      { month: "Apr", subs: 35 },
      { month: "May", subs: 38 },
      { month: "Jun", subs: 40 },
    ],
  },

  "2025": {
    area: data,               // reuse your EXISTING data
    bar: subscriptionData,    // reuse your EXISTING data
  },
};




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
  const [selectedYear, setSelectedYear] = useState("2025");

  // KPI logic
  const statsForYear =
    yearlyUserStats.find(item => item.year === selectedYear) || {
      total: 0,
      approved: 0,
    };
    const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
};


  const totalUsersForYear = statsForYear.total;
  const approvedUsersForYear = statsForYear.approved;
  const pendingUsersForYear =
    totalUsersForYear - approvedUsersForYear;

  const currentApprovalData =
  monthlyApprovalData[selectedYear] || [];

  const approvalVsPendingData = currentApprovalData.map((item) => ({
  month: item.month,
  approved: item.approved,
  pending: Math.max(0, Math.round(
    pendingUsersForYear / 12
  )),
}));


const currentSupplierData =
  monthlySupplierData[selectedYear] || [];

  const statusForYear = yearlyStatusData[selectedYear] || {
  approved: 0,
  pending: 0,
  rejected: 0,
  disabled: 0,
};

const pieData = [
  { name: "Approved", value: statusForYear.approved },
  { name: "Pending", value: statusForYear.pending },
  { name: "Rejected", value: statusForYear.rejected },
  { name: "Disabled", value: statusForYear.disabled },
];

  
  return (
    <AdminLayout header="Serial Subscription Tracking System" sidebarExtra={<ChatBox />}>
      <Head title="Admin Dashboard" />

      <div className="space-y-6">

        {/* TEXT INTRO */}
        <p className="text-gray-700 font-semibold">
  Welcome back! Here’s what’s happening with your account approvals
</p>


       {/* STORY + YEAR FILTER ROW */}
<div className="flex items-start justify-between gap-6 mb-4">
  
  {/* STORY TEXT */}
  <div className="max-w-3xl">
 
    <p className="text-lg font-semibold text-gray-700 leading-relaxed max-w-4xl">
    This dashboard provides a clear overview of user account approvals
  for the selected year. It shows how many accounts have been approved, how many remain pending,
  and how approval activity changes month by month. These insights help administrators assess
  processing efficiency, identify approval backlogs, and improve response time.
</p>

  </div>

  {/* YEAR FILTER */}
<div className="flex justify-end">
  <div className="w-56">
    <label className="block text-sm font-medium text-gray-900 mb-2">
  Select Year
</label>

    <Listbox value={selectedYear} onChange={setSelectedYear}>
      <div className="relative">
        <Listbox.Button className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {selectedYear}
        </Listbox.Button>

        <Listbox.Options className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          {years.map((year) => (
            <Listbox.Option
              key={year}
              value={year}
              className={({ active }) =>
                `cursor-pointer px-4 py-2 ${
                  active
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-700"
                }`
              }
            >
              {year}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  </div>
</div>




</div>



        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900">Total Users</p>
              <p className="mt-2 text-3xl font-extrabold text-gray-900">
  {totalUsersForYear}
</p>

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
              <p className="text-sm text-gray-700">Approved Users</p>
              <p className="mt-2 text-3xl font-extrabold text-gray-900">
  {approvedUsersForYear}
</p>

            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#3C8A6B" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Pending Users</p>
              <p className="mt-2 text-3xl font-extrabold text-gray-900">
  {pendingUsersForYear}
</p>

            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M12 6v6l4 2" stroke="#C8A93C" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* AREA CHART */}
       {/* TOP CHARTS – SIDE BY SIDE */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ACCOUNT APPROVAL TREND */}
<div className="bg-white rounded-xl p-6 shadow-md">
  <h3 className="text-lg font-semibold text-gray-800 mb-4">
    Account Approval Trend
  </h3>

  <div style={{ height: 320 }}>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={currentApprovalData}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="approved"
          stroke="#16a34a"
          fill="#86efac"
          name="Approved"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</div>
{/* APPROVAL VS PENDING (STACKED) */}
<div className="bg-white rounded-xl p-6 shadow-md">
  <h3 className="text-lg font-semibold text-gray-800 mb-4">
    Approval vs Pending
  </h3>

  <div style={{ height: 320 }}>
    <ResponsiveContainer width="100%" height={300}>
  <AreaChart data={approvalVsPendingData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Legend />

    <Area
      type="monotone"
      dataKey="approved"
      stackId="1"
      stroke="#16a34a"
      fill="#86efac"
      name="Approved"
    />

    <Area
      type="monotone"
      dataKey="pending"
      stackId="1"
      stroke="#f59e0b"
      fill="#fde68a"
      name="Pending"
    />
  </AreaChart>
</ResponsiveContainer>

  </div>
</div>
</div>



        {/* ================================ */}
        {/* DASHBOARD 2 + 3 SIDE BY SIDE     */}
        {/* ================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* BAR CHART */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800">
  Supplier Account Creation per Month
</h3>


            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
  <BarChart data={currentSupplierData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="suppliers" fill="#1d4ed8" />
</BarChart>


</ResponsiveContainer>

            </div>
          </div>

          {/* PIE CHART */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800">
  Account Status Distribution
</h3>


            <div style={{ height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
  data={pieData}
  dataKey="value"
  nameKey="name"
  cx="50%"
  cy="50%"
  outerRadius={80}
  label={renderCustomizedLabel}
  labelLine={false}
>
  {pieData.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
