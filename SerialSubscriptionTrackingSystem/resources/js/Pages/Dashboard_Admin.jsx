import React, { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaFilter, FaFileExcel } from 'react-icons/fa';
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

/* ================= CONSTANTS ================= */

const YEARS = [2022, 2023, 2024, 2025, 2026];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const COLORS = ["#2563eb", "#22c55e", "#facc15", "#ef4444"];

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
  // Dashboard statistics from database
  const [dashboardStats, setDashboardStats] = useState({
    users: { total: 0, approved: 0, pending: 0, disabled: 0 },
    suppliers: { total: 0, pending: 0, approved: 0, rejected: 0, avg_approval_time: 0, approval_backlog: 0, inactive_suppliers: 0 },
    subscriptions: { total: 0, active: 0 },
  });
  const [chartData, setChartData] = useState({
    monthly: [],
    supplier_status_pie: [],
    user_status_pie: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // FILTER MODE: year | month | week | custom
const [filterMode, setFilterMode] = useState("year");

const [year, setYear] = useState(2026);
const [startMonth, setStartMonth] = useState("January");
const [endMonth, setEndMonth] = useState("December");
const [startDate, setStartDate] = useState(firstDayOfMonth(2026, "January"));
const [endDate, setEndDate] = useState(lastDayOfMonth(2026, "December"));

const [showFilterModal, setShowFilterModal] = useState(false);
const [tempYear, setTempYear] = useState(year);
const [tempStartMonth, setTempStartMonth] = useState(startMonth);
const [tempEndMonth, setTempEndMonth] = useState(endMonth);
const [tempStartDate, setTempStartDate] = useState(startDate);
const [tempEndDate, setTempEndDate] = useState(endDate);

// calendar month for Week mode
const [calendarMonth, setCalendarMonth] = useState(monthIndex(startMonth));
const [calendarYear, setCalendarYear] = useState(year);

  // Fetch dashboard stats from database
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/admin/dashboard-stats', {
          params: {
            start_date: startDate,
            end_date: endDate,
          }
        });
        if (response.data.success) {
          setDashboardStats(response.data.stats);
          setChartData(response.data.charts);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardStats();
  }, [startDate, endDate]);


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


  /* ================= KPI DATA (FROM DATABASE) ================= */

// Use real data from database
const approvalBacklog = dashboardStats.suppliers.approval_backlog || 0;
const avgApprovalTime = dashboardStats.suppliers.avg_approval_time || 0;
const inactiveSuppliers = dashboardStats.suppliers.inactive_suppliers || 0;


  /* ================= CHART DATA (FROM DATABASE) ================= */

// Use monthly chart data from database, filtered by selected month range
const approvalTrend = useMemo(() => {
  if (!chartData.monthly || chartData.monthly.length === 0) {
    // Return placeholder data if no data from database
    return months.map(m => ({ month: m, approved: 0 }));
  }
  
  // Filter chart data by selected months
  return chartData.monthly
    .filter(item => months.includes(item.month))
    .map(item => ({
      month: item.month,
      approved: item.approved || 0,
    }));
}, [chartData.monthly, months]);


// Approval vs Pending chart data from database
const approvalVsPending = useMemo(() => {
  if (!chartData.monthly || chartData.monthly.length === 0) {
    return months.map(m => ({ month: m, approved: 0, pending: 0 }));
  }
  
  return chartData.monthly
    .filter(item => months.includes(item.month))
    .map(item => ({
      month: item.month,
      approved: item.approved || 0,
      pending: item.pending || 0,
    }));
}, [chartData.monthly, months]);


// Supplier creation chart data from database
const supplierCreation = useMemo(() => {
  if (!chartData.monthly || chartData.monthly.length === 0) {
    return months.map(m => ({ month: m, created: 0 }));
  }
  
  return chartData.monthly
    .filter(item => months.includes(item.month))
    .map(item => ({
      month: item.month,
      created: item.created || 0,
    }));
}, [chartData.monthly, months]);


// Pie chart data from database - supplier account status distribution
const pieData = useMemo(() => {
  if (chartData.supplier_status_pie && chartData.supplier_status_pie.length > 0) {
    return chartData.supplier_status_pie;
  }
  // Fallback to live stats
  return [
    { name: "Approved", value: dashboardStats.suppliers.approved || 0 },
    { name: "Pending", value: dashboardStats.suppliers.pending || 0 },
    { name: "Rejected", value: dashboardStats.suppliers.rejected || 0 },
  ];
}, [chartData.supplier_status_pie, dashboardStats.suppliers]);

  return (
    <AdminLayout>
      <Head title="Admin Dashboard" />

      <div className="space-y-6">

        {/* FILTERS - Dropdown Style (matching Admin Logs design) */}
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
          
          {/* Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 border-b border-gray-100 gap-4">
            
            {/* Title */}
            <h2 className="text-xl font-bold text-gray-800">Dashboard Overview</h2>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  setShowFilterModal(!showFilterModal);
                  // Sync temp values when opening
                  if (!showFilterModal) {
                    setTempYear(year);
                    setTempStartMonth(startMonth);
                    setTempEndMonth(endMonth);
                    setTempStartDate(startDate);
                    setTempEndDate(endDate);
                    if (filterMode === "week") {
                      setCalendarYear(year);
                      setCalendarMonth(monthIndex(startMonth));
                    }
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                <FaFilter size={14} />
                Filters
                {(filterMode !== 'year' || year !== 2026 || startDate !== firstDayOfMonth(2026, "January") || endDate !== lastDayOfMonth(2026, "December")) && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Active</span>
                )}
              </button>

              <button
                onClick={async () => {
                  try {
                    const response = await axios.get('/api/admin/export-report', {
                      params: {
                        start_date: startDate,
                        end_date: endDate,
                        dashboard_name: 'Admin Dashboard',
                      },
                      responseType: 'blob',
                    });
                    const blob = new Blob([response.data], {
                      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Admin_Dashboard_Report_${startDate}_to_${endDate}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error generating report:', error);
                    Swal.fire({ title: 'Failed to Generate Report', text: 'Please try again.', icon: 'error', confirmButtonColor: '#0062f4' });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                <FaFileExcel size={14} />
                Generate Report
              </button>
            </div>
          </div>

          {/* Filter Panel - Expandable (matching Admin Logs style) */}
          {showFilterModal && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                
                {/* Year Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <select
                    value={tempYear}
                    onChange={(e) => {
                      const selectedYear = parseInt(e.target.value);
                      setTempYear(selectedYear);
                      setTempStartDate(firstDayOfMonth(selectedYear, tempStartMonth));
                      setTempEndDate(lastDayOfMonth(selectedYear, tempEndMonth));
                      setCalendarYear(selectedYear);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Month Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                  <select
                    value={tempStartMonth}
                    onChange={(e) => {
                      const m = e.target.value;
                      setTempStartMonth(m);
                      setTempEndMonth(m);
                      setTempStartDate(firstDayOfMonth(tempYear, m));
                      setTempEndDate(lastDayOfMonth(tempYear, m));
                      setCalendarMonth(monthIndex(m));
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Months</option>
                    {MONTHS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Week Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Week</label>
                  <select
                    onChange={(e) => {
                      const weekNum = parseInt(e.target.value);
                      if (weekNum) {
                        // Calculate week start date
                        const janFirst = new Date(tempYear, 0, 1);
                        const daysOffset = (weekNum - 1) * 7;
                        const weekStart = new Date(janFirst);
                        weekStart.setDate(janFirst.getDate() + daysOffset - janFirst.getDay() + 1);
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 6);
                        
                        setTempStartDate(weekStart.toISOString().split("T")[0]);
                        setTempEndDate(weekEnd.toISOString().split("T")[0]);
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Week</option>
                    {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>Week {w}</option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    // Clear/Reset filters to defaults
                    setFilterMode('year');
                    setTempYear(2026);
                    setTempStartMonth('January');
                    setTempEndMonth('December');
                    setTempStartDate(firstDayOfMonth(2026, 'January'));
                    setTempEndDate(lastDayOfMonth(2026, 'December'));
                    setYear(2026);
                    setStartMonth('January');
                    setEndMonth('December');
                    setStartDate(firstDayOfMonth(2026, 'January'));
                    setEndDate(lastDayOfMonth(2026, 'December'));
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
                <button
                  onClick={() => {
                    applyFilter();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>


        {/* KPIs */}
        {/* ================= KPIs ================= */}
<div className="grid grid-cols-1 md:grid-cols-6 gap-4">
  <KPI title="Total Users" value={isLoading ? '...' : dashboardStats.users.total} />
  <KPI title="Approved Users" value={isLoading ? '...' : dashboardStats.users.approved} />
  <KPI title="Pending Accounts" value={isLoading ? '...' : dashboardStats.suppliers.pending} />

  <KPI
    title="Approval Backlog (>7 days)"
    value={isLoading ? '...' : approvalBacklog}
  />

  <KPI
    title="Avg Approval Time (days)"
    value={isLoading ? '...' : avgApprovalTime}
  />

  <KPI
    title="Inactive Approved Suppliers"
    value={isLoading ? '...' : inactiveSuppliers}
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