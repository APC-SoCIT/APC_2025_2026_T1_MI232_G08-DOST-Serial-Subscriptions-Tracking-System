import React, { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
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

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 4, CURRENT_YEAR - 3, CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

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

const dateRangeFactor = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) return 1;

  const diffDays = (end - start) / (1000 * 60 * 60 * 24);

return Math.max(diffDays / 365, 0.25);

};



/* ================= COMPONENT ================= */

export default function Dashboard() {
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

const [filterMode, setFilterMode] = useState("year");

const [year, setYear] = useState(CURRENT_YEAR);
const [startMonth, setStartMonth] = useState("January");
const [endMonth, setEndMonth] = useState("December");
const [startDate, setStartDate] = useState(firstDayOfMonth(CURRENT_YEAR, "January"));
const [endDate, setEndDate] = useState(lastDayOfMonth(CURRENT_YEAR, "December"));
const [activeKpi, setActiveKpi] = useState(null);

const [showFilterModal, setShowFilterModal] = useState(false);
const [tempYear, setTempYear] = useState(year);
const [tempStartMonth, setTempStartMonth] = useState(startMonth);
const [tempEndMonth, setTempEndMonth] = useState(endMonth);
const [tempStartDate, setTempStartDate] = useState(startDate);
const [tempEndDate, setTempEndDate] = useState(endDate);

/* ===== SUPPLIER (by account ID) / SERIAL TITLE FILTER STATE ===== */
const [supplierId, setSupplierId] = useState("");
const [serialTitle, setSerialTitle] = useState("");
const [tempSupplierId, setTempSupplierId] = useState("");
const [tempSerialTitle, setTempSerialTitle] = useState("");
const [filterOptions, setFilterOptions] = useState({ suppliers: [], serial_titles: [] });
// Tracks whether Apply Filters has ever been clicked — distinguishes the
// true default state (subscription cards hidden) from "All Suppliers"
// explicitly chosen and applied (cards shown, with system-wide totals).
const [filtersApplied, setFiltersApplied] = useState(false);

useEffect(() => {
  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get('/api/dashboard-filter-options', {
        params: { supplier_id: tempSupplierId || undefined }
      });
      if (response.data.success) {
        setFilterOptions({
          suppliers: response.data.suppliers || [],
          serial_titles: response.data.serial_titles || [],
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard filter options:', error);
    }
  };
  fetchFilterOptions();
}, [tempSupplierId]);

const [calendarMonth, setCalendarMonth] = useState(monthIndex(startMonth));
const [calendarYear, setCalendarYear] = useState(year);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/admin/dashboard-stats', {
          params: {
            start_date: startDate,
            end_date: endDate,
            supplier_id: supplierId || undefined,
            serial_title: serialTitle || undefined,
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
  }, [startDate, endDate, supplierId, serialTitle]);


const selectWeek = (day) => {
  const start = new Date(calendarYear, calendarMonth, day);

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

  setStartDate(tempStartDate);
  setEndDate(tempEndDate);

  const start = new Date(tempStartDate);
  const end = new Date(tempEndDate);

  const startMonthName = MONTHS[start.getMonth()];
  const endMonthName = MONTHS[end.getMonth()];

  setStartMonth(startMonthName);
  setEndMonth(endMonthName);

   setSupplierId(tempSupplierId);
  setSerialTitle(tempSerialTitle);
  setFiltersApplied(true);

  setShowFilterModal(false);
};

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

const dFactor = dateRangeFactor(startDate, endDate);
const selectedMonthIndex =
  MONTHS.includes(startMonth) ? monthIndex(startMonth) : 0;


  /* ================= KPI DATA (FROM DATABASE) ================= */

const approvalBacklog = dashboardStats.suppliers.approval_backlog || 0;
const avgApprovalTime = dashboardStats.suppliers.avg_approval_time || 0;
const disabledSupplierAccounts = dashboardStats.suppliers.disabled_supplier_accounts || 0;

  /* ================= CHART DATA (FROM DATABASE) ================= */

const approvalTrend = useMemo(() => {
  if (!chartData.monthly || chartData.monthly.length === 0) {
    return months.map(m => ({ month: m, approved: 0 }));
  }
  
  const monthlyByMonth = new Map(chartData.monthly.map(item => [item.month, item]));
  return months.map(month => ({
    month,
    approved: monthlyByMonth.get(month)?.approved || 0,
  }));
}, [chartData.monthly, months]);


const approvalVsPending = useMemo(() => {
  if (!chartData.monthly || chartData.monthly.length === 0) {
    return months.map(m => ({ month: m, approved: 0, pending: 0 }));
  }
  
  const monthlyByMonth = new Map(chartData.monthly.map(item => [item.month, item]));
  return months.map(month => ({
    month,
    approved: monthlyByMonth.get(month)?.approved || 0,
    pending: monthlyByMonth.get(month)?.pending || 0,
  }));
}, [chartData.monthly, months]);


const supplierCreation = useMemo(() => {
  if (!chartData.monthly || chartData.monthly.length === 0) {
    return months.map(m => ({ month: m, created: 0 }));
  }
  
  const monthlyByMonth = new Map(chartData.monthly.map(item => [item.month, item]));
  return months.map(month => ({
    month,
    created: monthlyByMonth.get(month)?.created || 0,
  }));
}, [chartData.monthly, months]);


const pieData = useMemo(() => {
  if (chartData.supplier_status_pie && chartData.supplier_status_pie.length > 0) {
    return chartData.supplier_status_pie;
  }
  return [
    { name: "Approved", value: dashboardStats.suppliers.approved || 0 },
    { name: "Pending", value: dashboardStats.suppliers.pending || 0 },
    { name: "Rejected", value: dashboardStats.suppliers.rejected || 0 },
  ];
}, [chartData.supplier_status_pie, dashboardStats.suppliers]);

const kpiCards = useMemo(() => {
  const cards = [];

  if (filtersApplied) {
    cards.push({
      id: "totalSubscriptions",
      title: "Total Subscriptions",
      value: isLoading ? '...' : dashboardStats.subscriptions.total,
      sourceLabel: "Subscription",
      sourcePath: "/dashboard-tpu-subscriptiontracking",
      chartIds: [],
    });
    cards.push({
      id: "activeSubscriptions",
      title: "Active Subscriptions",
      value: isLoading ? '...' : dashboardStats.subscriptions.active,
      sourceLabel: "Subscription",
      sourcePath: "/dashboard-tpu-subscriptiontracking",
      chartIds: [],
    });
  }

  cards.push(
  {
    id: "totalUsers",
    title: "Total Users",
    value: isLoading ? '...' : dashboardStats.users.total,
    sourceLabel: "List of User",
    sourcePath: "/list-of-user",
    chartIds: ["approvalTrend", "approvalVsPending", "statusDistribution"],
  },
   {
    id: "approvedUsers",
    title: "Approved Users",
    value: isLoading ? '...' : dashboardStats.users.approved,
    sourceLabel: "List of User",
    sourcePath: "/list-of-user",
    chartIds: ["approvalTrend", "approvalVsPending", "statusDistribution"],
  },
  {
    id: "pendingAccounts",
    title: "Pending Accounts",
    value: isLoading ? '...' : dashboardStats.suppliers.pending,
    sourceLabel: "Account Approval",
    sourcePath: "/account-approval",
    chartIds: ["approvalVsPending", "statusDistribution"],
  },
  {
    id: "approvalBacklog",
    title: "Approval Backlog (>7 days)",
    value: isLoading ? '...' : approvalBacklog,
    sourceLabel: "Account Approval",
    sourcePath: "/account-approval",
    chartIds: ["approvalVsPending"],
  },
  {
    id: "avgApprovalTime",
    title: "Avg Approval Time (days)",
    value: isLoading ? '...' : avgApprovalTime,
    sourceLabel: "Account Approval",
    sourcePath: "/account-approval",
    chartIds: ["approvalTrend"],
  },
   {
    id: "disabledSupplierAccounts",
    title: "Disabled Supplier Accounts",
    value: isLoading ? '...' : disabledSupplierAccounts,
    sourceLabel: "List of Supplier",
    sourcePath: "/list-of-supplier",
    chartIds: ["supplierCreation", "statusDistribution"],
  }
  );

  return cards;
}, [isLoading, dashboardStats, approvalBacklog, avgApprovalTime, disabledSupplierAccounts, supplierId, serialTitle, filtersApplied]);

const selectedKpi = activeKpi
  ? kpiCards.find((card) => card.id === activeKpi) || null
  : null;
const visibleKpiCards = selectedKpi ? [selectedKpi] : kpiCards;
const shouldShowChart = (chartId) => !selectedKpi || selectedKpi.chartIds.includes(chartId);

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
                  if (!showFilterModal) {
                    setTempYear(year);
                    setTempStartMonth(startMonth);
                    setTempEndMonth(endMonth);
                    setTempStartDate(startDate);
                    setTempEndDate(endDate);
                    setTempSupplierId(supplierId);
                    setTempSerialTitle(serialTitle);
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
                {(filterMode !== 'year' || year !== CURRENT_YEAR || startDate !== firstDayOfMonth(CURRENT_YEAR, "January") || endDate !== lastDayOfMonth(CURRENT_YEAR, "December") || supplierId || serialTitle) && (
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
                        supplier_id: supplierId || undefined,
                        serial_title: serialTitle || undefined,
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
                    link.download = `Admin_Dashboard_Report_${startDate}_to_${endDate}.xlsx`;
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

                {/* Supplier Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
                  <select
                    value={tempSupplierId}
                    onChange={(e) => {
                      setTempSupplierId(e.target.value);
                      setTempSerialTitle('');
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Suppliers</option>
                    {filterOptions.suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Serial Title Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Serial Title</label>
                  {filterOptions.serial_titles.length === 0 ? (
                    <select
                      value=""
                      disabled
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                    >
                      <option value="">No Serial Titles Yet</option>
                    </select>
                  ) : (
                    <select
                      value={tempSerialTitle}
                      onChange={(e) => setTempSerialTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Serial Titles</option>
                      {filterOptions.serial_titles.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Supplier and Serial Title filters apply only to subscription-related metrics.
              </p>

              {/* Filter Actions */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setFilterMode('year');
                    setTempYear(CURRENT_YEAR);
                    setTempStartMonth('January');
                    setTempEndMonth('December');
                    setTempStartDate(firstDayOfMonth(CURRENT_YEAR, 'January'));
                    setTempEndDate(lastDayOfMonth(CURRENT_YEAR, 'December'));
                    setTempSupplierId('');
                    setTempSerialTitle('');
                    setYear(CURRENT_YEAR);
                    setStartMonth('January');
                    setStartDate(firstDayOfMonth(CURRENT_YEAR, 'January'));
                    setEndDate(lastDayOfMonth(CURRENT_YEAR, 'December'));
                    setSupplierId('');
                    setSerialTitle('');
                    setFiltersApplied(false);
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
{selectedKpi && (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
    <p className="text-sm text-blue-900">
      Focus view: <span className="font-semibold">{selectedKpi.title}</span>
    </p>
    <button
      type="button"
      onClick={() => setActiveKpi(null)}
      className="px-3 py-1.5 text-sm text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100"
    >
      Show All Metrics
    </button>
  </div>
)}

<div className={`grid grid-cols-1 gap-4 ${selectedKpi ? "md:grid-cols-1" : "md:grid-cols-6"}`}>
  {visibleKpiCards.map((card) => (
    <KPI
      key={card.id}
      title={card.title}
      value={card.value}
      sourceLabel={card.sourceLabel}
      isActive={card.id === activeKpi}
      onSelect={() => setActiveKpi((prev) => prev === card.id ? null : card.id)}
      onSeeMore={() => router.visit(`${card.sourcePath}?month=${encodeURIComponent(startMonth === endMonth ? String(monthIndex(startMonth) + 1).padStart(2, "0") : '')}&year=${year}&start_date=${startDate}&end_date=${endDate}`)}
    />
  ))}
</div>


        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {shouldShowChart("approvalTrend") && (
          <Chart title="Account Approval Trend">
            <ResponsiveContainer height={280}>
              <LineChart data={approvalTrend}>
               <XAxis
  dataKey="month"
  interval={0}
  angle={-35}
  textAnchor="end"
  height={50}
  tick={{ fontSize: 12, fontWeight: 600 }}
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
          )}

          {shouldShowChart("approvalVsPending") && (
          <Chart title="Approval vs Pending">
  <ResponsiveContainer height={280}>
    <AreaChart data={approvalVsPending}>
      <XAxis
  dataKey="month"
  interval={0}
  angle={-35}
  textAnchor="end"
  height={50}
  tick={{ fontSize: 12, fontWeight: 600 }}
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
          )}


          {shouldShowChart("supplierCreation") && (
          <Chart title="Supplier Account Creation">
            <ResponsiveContainer height={280}>
              <BarChart data={supplierCreation}>
                <XAxis
  dataKey="month"
  interval={0}
  angle={-35}
  textAnchor="end"
  height={50}
  tick={{ fontSize: 12, fontWeight: 600 }}
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
          )}

          {shouldShowChart("statusDistribution") && (
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
          )}


        </div>
      </div>
    </AdminLayout>
  );
}

/* ================= UI COMPONENTS ================= */

const KPI = ({ title, value, sourceLabel, isActive, onSelect, onSeeMore }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onSelect}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect();
      }
    }}
    className={`bg-white p-6 rounded-xl shadow border cursor-pointer transition ${isActive ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-blue-200"}`}
  >
    <p className="text-base md:text-lg font-semibold text-gray-600">
      {title}
    </p>
    <p className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-1">
      {value}
    </p>
    <div className="mt-4 flex justify-end">
      <button
        type="button"
        aria-label={`See more in ${sourceLabel}`}
        title={`Open ${sourceLabel}`}
        onClick={(e) => {
          e.stopPropagation();
          onSeeMore();
        }}
        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
      >
        See More
      </button>
    </div>
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