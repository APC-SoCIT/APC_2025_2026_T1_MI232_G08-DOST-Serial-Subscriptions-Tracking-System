import React, { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { Listbox } from "@headlessui/react";
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

/* ================= CONSTANTS ================= */

const YEARS = [2022, 2023, 2024, 2025];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const COLORS = ["#2563eb", "#22c55e", "#facc15", "#ef4444"];

const BASE_YEAR_DATA = {
  2022: { approved: 140, pending: 40, disabled: 20, rejected: 10 },
  2023: { approved: 145, pending: 65, disabled: 18, rejected: 12 },
  2024: { approved: 160, pending: 55, disabled: 22, rejected: 15 },
  2025: { approved: 180, pending: 70, disabled: 30, rejected: 20 },
};

/* ================= HELPERS ================= */

const monthIndex = (month) => MONTHS.indexOf(month);
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={14}
      fontWeight="700"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


const firstDayOfMonth = (year, month) =>
  `${year}-${String(monthIndex(month) + 1).padStart(2, "0")}-01`;

const lastDayOfMonth = (year, month) =>
  new Date(year, monthIndex(month) + 1, 0).toISOString().split("T")[0];

const monthRange = (start, end) => {
  const s = monthIndex(start);
  const e = monthIndex(end);
  return MONTHS.slice(s, e + 1);
};

const yearWeight = (year) => {
  switch (year) {
    case 2022: return 0.8;
    case 2023: return 0.9;
    case 2024: return 1.0;
    case 2025: return 1.1;
    default: return 1.0;
  }
};

// 🔑 NEW helper — reacts to Start Date + End Date
const dateRangeFactor = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) return 0.1;

  const diffDays = (end - start) / (1000 * 60 * 60 * 24);

  // normalize vs full year
  return Math.min(diffDays / 365, 1);
};


/* ================= COMPONENT ================= */

export default function Dashboard() {
  const [year, setYear] = useState(2024);
  const [startMonth, setStartMonth] = useState("January");
  const [endMonth, setEndMonth] = useState("December");
  const [startDate, setStartDate] = useState(firstDayOfMonth(2024, "January"));
  const [endDate, setEndDate] = useState(lastDayOfMonth(2024, "December"));

  /* AUTO-SYNC DATES WHEN MONTH/YEAR CHANGES */
  useEffect(() => {
    setStartDate(firstDayOfMonth(year, startMonth));
  }, [year, startMonth]);

  useEffect(() => {
    setEndDate(lastDayOfMonth(year, endMonth));
  }, [year, endMonth]);

  const months = monthRange(startMonth, endMonth);
const yFactor = yearWeight(year);

// ✅ THIS is what makes KPIs react to Start Date / End Date
const dFactor = dateRangeFactor(startDate, endDate);


  /* ================= KPI DATA ================= */

const stats = useMemo(() => {
  const base = BASE_YEAR_DATA[year];
  const monthScale = months.length / 12;

  return {
    approved: Math.round(base.approved * monthScale * dFactor),
    pending: Math.round(base.pending * monthScale * dFactor),
    disabled: Math.round(base.disabled * monthScale * dFactor),
    rejected: Math.round(base.rejected * monthScale * dFactor),
    total: Math.round(
      (base.approved + base.pending) * monthScale * dFactor
    ),
  };
}, [year, months, dFactor]);


// Approval backlog (>7 days)
const approvalBacklog = Math.max(
  1,
  Math.round(stats.pending * 0.25 * dFactor)
);

// Average approval time (days)
const avgApprovalTime = Math.max(
  0.5,
  Number((2.5 * (1 - dFactor + 0.2)).toFixed(1))
);

// Inactive approved suppliers
const inactiveSuppliers = Math.max(
  1,
  Math.round(stats.approved * 0.07 * dFactor)
);



  /* ================= CHART DATA ================= */

 const approvalTrend = months.map((m, i) => ({
  month: m,
  approved: Math.round((10 + i) * yFactor * dFactor),
}));


 const approvalVsPending = months.map((m, i) => ({
  month: m,
  approved: Math.round((15 + i) * yFactor * dFactor),
  pending: Math.max(1, Math.round((12 - i) * dFactor)),
}));


  const supplierCreation = months.map((m, i) => ({
  month: m,
  created: Math.round((15 + i * 2) * yFactor * dFactor),
}));


  const pieData = [
    { name: "Approved", value: stats.approved },
    { name: "Pending", value: stats.pending },
    { name: "Disabled", value: stats.disabled },
    { name: "Rejected", value: stats.rejected },
  ];

  return (
    <AdminLayout>
      <Head title="Admin Dashboard" />

      <div className="space-y-6">

        {/* FILTERS */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Dashboard Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <SmallSelect label="Year" value={year} onChange={setYear} options={YEARS} />
            <SmallSelect label="Start Month" value={startMonth} onChange={setStartMonth} options={MONTHS} />
            <SmallSelect label="End Month" value={endMonth} onChange={setEndMonth} options={MONTHS} />
            <SmallInput label="Start Date" value={startDate} onChange={setStartDate} />
            <SmallInput label="End Date" value={endDate} onChange={setEndDate} />
          </div>
        </div>

        {/* KPIs */}
        {/* ================= KPIs ================= */}
<div className="grid grid-cols-1 md:grid-cols-6 gap-4">
  <KPI title="Total Users" value={stats.total} />
  <KPI title="Approved Users" value={stats.approved} />
  <KPI title="Pending Users" value={stats.pending} />

  <KPI
    title="Approval Backlog (>7 days)"
    value={approvalBacklog}
  />

  <KPI
    title="Avg Approval Time (days)"
    value={avgApprovalTime}
  />

  <KPI
    title="Inactive Approved Suppliers"
    value={inactiveSuppliers}
  />
</div>


        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Chart title="Account Approval Trend">
            <ResponsiveContainer height={280}>
              <LineChart data={approvalTrend}>
               <XAxis
  dataKey="month"
  tick={{ fontSize: 20, fontWeight: 600 }}
/>
                <YAxis
  tick={{ fontSize: 20, fontWeight: 600 }}
/>
                <Tooltip />
                <Legend />
                <Line
  type="monotone"
  dataKey="approved"
  stroke="#2563eb"
  strokeWidth={4}
  dot={{ r: 4 }}
/>
              </LineChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Approval vs Pending">
  <ResponsiveContainer height={280}>
    <AreaChart data={approvalVsPending}>
      <XAxis
  dataKey="month"
  tick={{ fontSize: 20, fontWeight: 600 }}
/>
                <YAxis
  tick={{ fontSize: 20, fontWeight: 600 }}
/>

      <Tooltip />
      <Legend />
      <Area
        type="monotone"
        dataKey="approved"
        fill="#0514e9ff"
        stroke="#0717efff"
      />
      <Area
        type="monotone"
        dataKey="pending"
        fill="#0acaecff"
        stroke="#0be2f1ff"
      />
    </AreaChart>
  </ResponsiveContainer>
</Chart>


          <Chart title="Supplier Account Creation">
            <ResponsiveContainer height={280}>
              <BarChart data={supplierCreation}>
                <XAxis
  dataKey="month"
  tick={{ fontSize: 20, fontWeight: 600 }}
/>
                <YAxis
  tick={{ fontSize: 20, fontWeight: 600 }}
/>
                <Tooltip />
                <Legend />
                <Bar dataKey="created" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Account Status Distribution">
  <ResponsiveContainer height={280}>
    <PieChart>
      <Pie
        data={pieData}
        dataKey="value"
        cx="50%"
        cy="50%"
        innerRadius={35}
        outerRadius={95}
        label={renderPieLabel}
        labelLine={false}
      >
        {pieData.map((_, i) => (
          <Cell key={i} fill={COLORS[i]} />
        ))}
      </Pie>
      <Legend />
    </PieChart>
  </ResponsiveContainer>
</Chart>


        </div>
      </div>
    </AdminLayout>
  );
}

/* ================= UI COMPONENTS ================= */

const KPI = ({ title, value }) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <p className="text-base md:text-lg font-semibold text-gray-600">
      {title}
    </p>
    <p className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-1">
      {value}
    </p>
  </div>
);


const Chart = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
      {title}
    </h3>
    {children}
  </div>
);


const SmallSelect = ({ label, value, onChange, options }) => (
  <div>
    <label className="text-lg font-bold">
      {label}
    </label>

    <Listbox value={value} onChange={onChange}>
      <Listbox.Button className="w-full border rounded px-3 py-2 text-left text-base font-semibold">
        {value}
      </Listbox.Button>

      <Listbox.Options className="absolute z-10 bg-white border rounded shadow max-h-48 overflow-auto w-48 text-base font-medium">
        {options.map(o => (
          <Listbox.Option
            key={o}
            value={o}
            className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
          >
            {o}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  </div>
);


const SmallInput = ({ label, value, onChange }) => (
  <div>
    <label className="text-lg font-bold">

      {label}
    </label>

    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border rounded px-3 py-2 text-base font-semibold"
    />
  </div>
);
