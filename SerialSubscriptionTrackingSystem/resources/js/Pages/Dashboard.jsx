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

const getDaysInMonth = (year, month) => {
  const days = [];
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Empty cells before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let d = 1; d <= totalDays; d++) {
    days.push(d);
  }

  return days;
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

  if (end <= start) return 1;

  const diffDays = (end - start) / (1000 * 60 * 60 * 24);

// Minimum factor so charts don't collapse
return Math.max(diffDays / 365, 0.25);

};



/* ================= COMPONENT ================= */

export default function Dashboard() {
  // FILTER MODE: year | month | week | custom
const [filterMode, setFilterMode] = useState("year");

const [year, setYear] = useState(2024);
const [startMonth, setStartMonth] = useState("January");
const [endMonth, setEndMonth] = useState("December");
const [startDate, setStartDate] = useState(firstDayOfMonth(2024, "January"));
const [endDate, setEndDate] = useState(lastDayOfMonth(2024, "December"));

const [showFilterModal, setShowFilterModal] = useState(false);
const [tempYear, setTempYear] = useState(year);
const [tempStartMonth, setTempStartMonth] = useState(startMonth);
const [tempEndMonth, setTempEndMonth] = useState(endMonth);
const [tempStartDate, setTempStartDate] = useState(startDate);
const [tempEndDate, setTempEndDate] = useState(endDate);

// calendar month for Week mode
const [calendarMonth, setCalendarMonth] = useState(monthIndex(startMonth));
const [calendarYear, setCalendarYear] = useState(year);


const selectWeek = (day) => {
  const start = new Date(calendarYear, calendarMonth, day);

  // Start of week (Monday)
  const dayOfWeek = start.getDay();
  const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

  const weekStart = new Date(calendarYear, calendarMonth, diff);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  setTempStartDate(weekStart.toISOString().split("T")[0]);
  setTempEndDate(weekEnd.toISOString().split("T")[0]);
};

const applyFilter = () => {
  setYear(tempYear);

  // Always update dates
  setStartDate(tempStartDate);
  setEndDate(tempEndDate);

  // 🔥 IMPORTANT: derive months from dates (for Custom & Week)
  const start = new Date(tempStartDate);
  const end = new Date(tempEndDate);

  const startMonthName = MONTHS[start.getMonth()];
  const endMonthName = MONTHS[end.getMonth()];

  setStartMonth(startMonthName);
  setEndMonth(endMonthName);

  setShowFilterModal(false);
};


  /* AUTO-SYNC DATES WHEN MONTH/YEAR CHANGES */

  useEffect(() => {
  if (filterMode === "week") {
    setCalendarYear(year);
    setCalendarMonth(monthIndex(startMonth));
  }
}, [filterMode]);

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
const selectedMonthIndex =
  MONTHS.includes(startMonth) ? monthIndex(startMonth) : 0;


  /* ================= KPI DATA ================= */

const stats = useMemo(() => {
  const base = BASE_YEAR_DATA[year];

  // Year mode = full year
  if (filterMode === "year") {
    return base;
  }

  // Month mode = cumulative to month
  if (filterMode === "month") {
    const monthProgress = (selectedMonthIndex + 1) / 12;

    return {
      approved: Math.round(base.approved * monthProgress),
      pending: Math.round(base.pending * monthProgress),
      disabled: Math.round(base.disabled * monthProgress),
      rejected: Math.round(base.rejected * monthProgress),
      total: Math.round(
        (base.approved + base.pending) * monthProgress
      ),
    };
  }

  // Week / Custom = scale by days
  return {
    approved: Math.round(base.approved * dFactor),
    pending: Math.round(base.pending * dFactor),
    disabled: Math.round(base.disabled * dFactor),
    rejected: Math.round(base.rejected * dFactor),
    total: Math.round(
      (base.approved + base.pending) * dFactor
    ),
  };
}, [year, startMonth, dFactor, filterMode]);


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

const approvalTrend = months.map((m, i) => {
  const idx = monthIndex(m);
  return {
    month: m,
    approved: Math.round(
  (10 + idx) *
  yFactor *
  (filterMode === "week" || filterMode === "custom" ? dFactor : 1)
)

  };
});



const approvalVsPending = months.map((m) => {
  const idx = monthIndex(m);
  return {
    month: m,
    approved: Math.round((15 + idx) * yFactor * dFactor),
    pending: Math.max(1, Math.round((12 - idx) * dFactor)),
  };
});



 const supplierCreation = months.map((m) => {
  const idx = monthIndex(m);
  return {
    month: m,
    created: Math.round((15 + idx * 2) * yFactor * dFactor),
  };
});



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
        {/* ================= NEW FILTER ================= */}
{/* FILTER HEADER */}
<div className="relative bg-white p-5 rounded-xl shadow flex items-center justify-between">

  <h2 className="text-xl font-bold">Filter by</h2>

  <div className="flex gap-2">
    {["year", "month", "week", "custom"].map(mode => (
      <button
        key={mode}
       onClick={() => {
  setFilterMode(mode);
  setShowFilterModal(true);

  // load current values
  setTempYear(year);
  setTempStartMonth(startMonth);
  setTempEndMonth(endMonth);
  setTempStartDate(startDate);
  setTempEndDate(endDate);

  // IMPORTANT: sync calendar for Week mode
  if (mode === "week") {
    setCalendarYear(year);
    setCalendarMonth(monthIndex(startMonth));
  }
}}
        className="px-4 py-2 rounded-full bg-gray-100 font-semibold hover:bg-gray-200"
      >
        {mode.charAt(0).toUpperCase() + mode.slice(1)}
      </button>
    ))}
  </div>
</div>


  
  {/* ================= FILTER MODAL ================= */}
{showFilterModal && (
  <div className="absolute right-6 top-20 z-50">
    <div className="bg-white w-[420px] rounded-xl shadow-2xl border p-6 space-y-4">


      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Filter by</h3>
        <button
          onClick={() => setShowFilterModal(false)}
          className="text-gray-500 text-xl"
        >
          ×
        </button>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["year", "month", "week", "custom"].map(mode => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`px-3 py-1 rounded-full text-sm font-semibold border
              ${filterMode === mode
                ? "bg-green-700 text-white"
                : "bg-gray-100"}`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* YEAR MODE */}
      {filterMode === "year" && (
        <div className="grid grid-cols-3 gap-3">
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => setTempYear(y)}
              className={`p-3 rounded-lg border font-semibold
                ${tempYear === y
                  ? "bg-green-700 text-white"
                  : "bg-gray-100"}`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {/* MONTH MODE */}
      {filterMode === "month" && (
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-auto">
          {MONTHS.map(m => (
            <button
              key={m}
onClick={() => {
  setTempStartMonth(m);
  setTempEndMonth(m);

  // 🔥 IMPORTANT: also update dates
  setTempStartDate(firstDayOfMonth(tempYear, m));
  setTempEndDate(lastDayOfMonth(tempYear, m));

  setCalendarMonth(monthIndex(m));
  setCalendarYear(tempYear);
}}


              className={`p-2 text-sm rounded border
                ${tempStartMonth === m
                  ? "bg-green-700 text-white"
                  : "bg-gray-100"}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

     {filterMode === "week" && (
  <div className="space-y-3">

    {/* Month Navigation */}
    <div className="flex justify-between items-center font-semibold">
      <button
        onClick={() => {
          if (calendarMonth === 0) {
            setCalendarMonth(11);
            setCalendarYear(calendarYear - 1);
          } else {
            setCalendarMonth(calendarMonth - 1);
          }
        }}
      >
        ←
      </button>

      <span>
        {MONTHS[calendarMonth]} {calendarYear}
      </span>

      <button
        onClick={() => {
          if (calendarMonth === 11) {
            setCalendarMonth(0);
            setCalendarYear(calendarYear + 1);
          } else {
            setCalendarMonth(calendarMonth + 1);
          }
        }}
      >
        →
      </button>
    </div>

    {/* Calendar Grid */}
    <div className="grid grid-cols-7 gap-2 text-center">
      {getDaysInMonth(calendarYear, calendarMonth).map((day, i) => (
        <button
          key={i}
          disabled={!day}
          onClick={() => day && selectWeek(day)}
          className={`p-2 rounded-lg text-sm
            ${day ? "hover:bg-green-100" : ""}
          `}
        >
          {day || ""}
        </button>
      ))}
    </div>

    {/* Selected Range Preview */}
    <div className="text-sm text-gray-600">
      {tempStartDate} → {tempEndDate}
    </div>
  </div>
)}


      {/* CUSTOM MODE */}
      {filterMode === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <SmallInput label="Start Date" value={tempStartDate} onChange={setTempStartDate} />
          <SmallInput label="End Date" value={tempEndDate} onChange={setTempEndDate} />
        </div>
      )}

      {/* APPLY BUTTON */}
      <button
        onClick={applyFilter}
        className="w-full bg-green-800 text-white py-3 rounded-lg font-bold"
      >
        Apply
      </button>

    </div>
  </div>
)}


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