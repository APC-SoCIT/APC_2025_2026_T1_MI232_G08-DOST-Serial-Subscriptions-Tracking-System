import React, { useState, useMemo, useEffect } from "react";
import SupplierLayout from "@/Layouts/SupplierLayout";
import { Head } from "@inertiajs/react";
import axios from 'axios';
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

const COLORS = {
  awarded: "#2563eb",
  preparing: "#facc15",
  forDelivery: "#22c55e",
  delivered: "#16a34a",
  returned: "#ef4444",
};

/* ================= HELPERS ================= */

const monthIndex = (m) => MONTHS.indexOf(m);

const monthRange = (start, end) =>
  MONTHS.slice(monthIndex(start), monthIndex(end) + 1);

const firstDayOfMonth = (year, month) =>
  `${year}-${String(monthIndex(month)+1).padStart(2,"0")}-01`;

const lastDayOfMonth = (year, month) =>
  new Date(year, monthIndex(month)+1, 0).toISOString().split("T")[0];

const yearWeight = (year) =>
  ({2022:0.9, 2023:0.95, 2024:1, 2025:1.1}[year] || 1);

const dateRangeFactor = (start, end) => {
  const diff = (new Date(end) - new Date(start)) / (1000*60*60*24);
  return Math.max(diff/365, 0.15);
};

const getDaysInMonth = (year, month) => {
  const days = [];
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();

  for (let i=0;i<first;i++) days.push(null);
  for (let d=1; d<=total; d++) days.push(d);

  return days;
};

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + r * Math.cos(-midAngle * Math.PI/180);
  const y = cy + r * Math.sin(-midAngle * Math.PI/180);

  return (
    <text x={x} y={y} fill="#fff" fontSize={14} fontWeight="bold" textAnchor="middle">
      {(percent*100).toFixed(0)}%
    </text>
  );
};

/* ================= COMPONENT ================= */

export default function SupplierDashboard() {

  /* ===== DASHBOARD DATA FROM DATABASE ===== */
  const [dashboardStats, setDashboardStats] = useState({
    awarded: 0,
    preparing: 0,
    for_delivery: 0,
    delivered: 0,
    returned: 0,
    success_rate: 0,
  });
  const [chartData, setChartData] = useState({ monthly: [] });
  const [isLoading, setIsLoading] = useState(true);

  /* ===== MAIN FILTER STATE (APPLIED) ===== */

  const [filterMode, setFilterMode] = useState("year");
  const [year, setYear] = useState(2026);
  const [startMonth, setStartMonth] = useState("January");
  const [endMonth, setEndMonth] = useState("December");
  const [startDate, setStartDate] = useState(firstDayOfMonth(2026,"January"));
  const [endDate, setEndDate] = useState(lastDayOfMonth(2026,"December"));

  const [showFilter, setShowFilter] = useState(false);

  /* ===== TEMP STATE (LIKE ADMIN) ===== */

  const [tempYear, setTempYear] = useState(year);
  const [tempStartMonth, setTempStartMonth] = useState(startMonth);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const [calendarMonth, setCalendarMonth] = useState(monthIndex(startMonth));
  const [calendarYear, setCalendarYear] = useState(year);

  /* ===== APPLY FILTER ===== */

  const applyFilter = () => {
    setYear(tempYear);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);

    const s = new Date(tempStartDate);
    const e = new Date(tempEndDate);

    setStartMonth(MONTHS[s.getMonth()]);
    setEndMonth(MONTHS[e.getMonth()]);

    setShowFilter(false);
  };

  /* ===== WEEK SELECT ===== */

  const selectWeek = (day) => {
    const selected = new Date(calendarYear, calendarMonth, day);
    const dow = selected.getDay();

    const monday = new Date(selected);
    monday.setDate(selected.getDate() - dow + (dow===0?-6:1));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate()+6);

    setTempStartDate(monday.toISOString().split("T")[0]);
    setTempEndDate(sunday.toISOString().split("T")[0]);
  };

  /* ===== FETCH DASHBOARD DATA FROM DATABASE ===== */
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/supplier/dashboard-stats', {
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
        console.error('Error fetching Supplier dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardStats();
  }, [startDate, endDate]);

  /* ===== FACTOR ===== */

  const factor = useMemo(()=>{
    const y = yearWeight(year);
    if(filterMode==="year") return y;
    if(filterMode==="month")
      return y * ((monthIndex(startMonth)+1)/12);

    return y * dateRangeFactor(startDate,endDate);
  },[filterMode,year,startMonth,startDate,endDate]);

  const months = monthRange(startMonth,endMonth);

  /* ================= CHART DATA (FROM DATABASE) ================= */

  const pipelineData = useMemo(() => {
    if (chartData.monthly && chartData.monthly.length > 0) {
      return chartData.monthly
        .filter(item => months.includes(item.month))
        .map(item => ({
          month: item.month,
          awarded: item.awarded || 0,
          preparing: item.preparing || 0,
          forDelivery: item.forDelivery || 0,
          delivered: item.delivered || 0,
          returned: item.returned || 0,
        }));
    }
    return months.map((m) => ({
      month: m,
      awarded: 0,
      preparing: 0,
      forDelivery: 0,
      delivered: 0,
      returned: 0,
    }));
  }, [chartData.monthly, months]);

  /* ================= KPIs (COMPUTED FROM CHART DATA FOR ALIGNMENT) ================= */

  // Compute KPIs as sum of pipelineData to ensure alignment with charts
  const kpis = useMemo(() => {
    const totals = pipelineData.reduce((acc, month) => ({
      awarded: acc.awarded + (month.awarded || 0),
      preparing: acc.preparing + (month.preparing || 0),
      forDelivery: acc.forDelivery + (month.forDelivery || 0),
      delivered: acc.delivered + (month.delivered || 0),
      returned: acc.returned + (month.returned || 0),
    }), { awarded: 0, preparing: 0, forDelivery: 0, delivered: 0, returned: 0 });
    
    const successRate = totals.awarded > 0 
      ? Math.round(((totals.delivered - totals.returned) / totals.awarded) * 100) 
      : 0;
    
    return {
      awarded: totals.awarded,
      preparing: totals.preparing,
      forDelivery: totals.forDelivery,
      delivered: totals.delivered,
      returned: totals.returned,
      success: Math.max(0, successRate),
    };
  }, [pipelineData]);

  // Derive deliveryTrend from pipelineData to ensure consistency
  const deliveryTrend = useMemo(() => {
    return pipelineData.map(item => ({
      month: item.month,
      delivered: item.delivered || 0,
    }));
  }, [pipelineData]);

  const volumeData = useMemo(() => {
    return pipelineData.map(item => ({
      month: item.month,
      volume: item.awarded || 0,
    }));
  }, [pipelineData]);

  const pieData = [
    { name: "Delivered (Passed)", value: kpis.delivered },
    { name: "Returned", value: kpis.returned }
  ];


  /* ================= UI ================= */

  return (
    <SupplierLayout>
      <Head title="Supplier Dashboard" />

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
                  setShowFilter(!showFilter);
                  if (!showFilter) {
                    setTempYear(year);
                    setTempStartMonth(startMonth);
                    setTempStartDate(startDate);
                    setTempEndDate(endDate);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                <FaFilter size={14} />
                Filters
                {(year !== 2026 || startDate !== firstDayOfMonth(2026, "January") || endDate !== lastDayOfMonth(2026, "December")) && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Active</span>
                )}
              </button>

              <button
                onClick={async () => {
                  try {
                    const response = await axios.get('/api/supplier/export-report', {
                      params: {
                        start_date: startDate,
                        end_date: endDate,
                        dashboard_name: 'Supplier Dashboard',
                      },
                      responseType: 'blob',
                    });
                    const blob = new Blob([response.data], {
                      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Supplier_Dashboard_Report_${startDate}_to_${endDate}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error generating report:', error);
                    alert('Failed to generate report. Please try again.');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                <FaFileExcel size={14} />
                Generate Report
              </button>
            </div>
          </div>

          {/* Filter Panel - Expandable */}
          {showFilter && (
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
                      setTempStartDate(firstDayOfMonth(selectedYear, tempStartMonth || "January"));
                      setTempEndDate(lastDayOfMonth(selectedYear, tempStartMonth || "December"));
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
                      if (m) {
                        setTempStartDate(firstDayOfMonth(tempYear, m));
                        setTempEndDate(lastDayOfMonth(tempYear, m));
                      }
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
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setFilterMode('year');
                    setTempYear(2026);
                    setTempStartMonth('January');
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
                  onClick={applyFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== KPIs ===== */}
        <div className="grid md:grid-cols-6 gap-4">
          <KPI title="Awarded Serials" value={kpis.awarded}/>
          <KPI title="Preparing Delivery" value={kpis.preparing}/>
          <KPI title="For Delivery" value={kpis.forDelivery}/>
          <KPI title="Delivered to GSPS" value={kpis.delivered}/>
          <KPI title="Returned" value={kpis.returned}/>
          <KPI title="Success Rate" value={`${kpis.success}%`}/>
        </div>

        {/* ===== CHARTS ===== */}
        <div className="grid md:grid-cols-2 gap-6">

          <Chart title="Delivery Pipeline Status">
            <ResponsiveContainer height={300}>
              <AreaChart data={pipelineData}>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Tooltip/>
                <Legend 
  verticalAlign="bottom"
  height={36}
/>

                <Area
  type="monotone"
  dataKey="awarded"
  name="Awarded"
  stackId="1"
  fill={COLORS.awarded}
  stroke={COLORS.awarded}
  dot={{ r: 4 }}
  isAnimationActive={false}
/>

<Area
  type="monotone"
  dataKey="preparing"
  name="Preparing"
  stackId="1"
  fill={COLORS.preparing}
  stroke={COLORS.preparing}
  dot={{ r: 4 }}
  isAnimationActive={false}
/>

<Area
  type="monotone"
  dataKey="forDelivery"
  name="For Delivery"
  stackId="1"
  fill={COLORS.forDelivery}
  stroke={COLORS.forDelivery}
  dot={{ r: 4 }}
  isAnimationActive={false}
/>

<Area
  type="monotone"
  dataKey="delivered"
  name="Delivered"
  stackId="1"
  fill={COLORS.delivered}
  stroke={COLORS.delivered}
  dot={{ r: 4 }}
  isAnimationActive={false}
/>

<Area
  type="monotone"
  dataKey="returned"
  name="Returned"
  stackId="1"
  fill={COLORS.returned}
  stroke={COLORS.returned}
  dot={{ r: 4 }}
  isAnimationActive={false}
/>

              </AreaChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Delivered Serials Trend">
            <ResponsiveContainer height={300}>
              <LineChart data={deliveryTrend}>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Tooltip/>
                <Line dataKey="delivered" stroke="#2563eb" strokeWidth={3} dot={{ r: 6 }} isAnimationActive={false}/>
              </LineChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Monthly Delivery Volume">
            <ResponsiveContainer height={300}>
              <BarChart data={volumeData}>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="volume" fill="#2563eb"/>
              </BarChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Inspection Outcome">
            <ResponsiveContainer height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={100}
                  label={renderPieLabel}
                  labelLine={false}
                >
                  <Cell fill="#22c55e"/>
                  <Cell fill="#ef4444"/>
                </Pie>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </Chart>

        </div>
      </div>
    </SupplierLayout>
  );
}

/* ================= UI ================= */

const KPI = ({title,value}) => (
  <div className="bg-white p-5 rounded-xl shadow">
    <p className="text-sm text-gray-600">{title}</p>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

const Chart = ({title,children}) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <h3 className="font-bold mb-4">{title}</h3>
    {children}
  </div>
);
