import React, { useState, useMemo, useEffect } from "react";
import InspectionLayout from "@/Layouts/InspectionLayout";
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

const YEARS = [2022, 2023, 2024, 2025, 2026];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const COLORS = {
  received: "#2563eb",
  pending: "#facc15",
  inspected: "#22c55e",
  returned: "#ef4444"
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
  if (!start || !end) return 1;
  const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
  return Math.max(diff / 365, 0.02);
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
const getDaysInMonth = (year, month) => {
  const days = [];
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < first; i++) days.push(null);
  for (let d = 1; d <= total; d++) days.push(d);

  return days;
};


/* ================= COMPONENT ================= */

export default function InspectionDashboard() {

  /* ===== DASHBOARD DATA FROM DATABASE ===== */
  const [dashboardStats, setDashboardStats] = useState({
    received: 0,
    inspected: 0,
    pending: 0,
    returned: 0,
    success_rate: 0,
  });
  const [chartData, setChartData] = useState({ monthly: [] });
  const [isLoading, setIsLoading] = useState(true);

 /* ===== FILTER STATE (same as Supplier) ===== */

const [filterMode, setFilterMode] = useState("year");
const [year, setYear] = useState(2026);
const [startMonth, setStartMonth] = useState("January");
const [endMonth, setEndMonth] = useState("December");
const [startDate, setStartDate] = useState(firstDayOfMonth(2026,"January"));
const [endDate, setEndDate] = useState(lastDayOfMonth(2026,"December"));
const [activeKpi, setActiveKpi] = useState(null);

const [showFilter, setShowFilter] = useState(false);

/* TEMP (Apply system) */
const [tempYear, setTempYear] = useState(year);
const [tempStartMonth, setTempStartMonth] = useState(startMonth);
const [tempStartDate, setTempStartDate] = useState(startDate);
const [tempEndDate, setTempEndDate] = useState(endDate);

const [calendarMonth, setCalendarMonth] = useState(monthIndex(startMonth));
const [calendarYear, setCalendarYear] = useState(year);

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

/* ===== WEEK SELECT (REQUIRED) ===== */

const selectWeek = (day) => {
  const selected = new Date(calendarYear, calendarMonth, day);
  const dow = selected.getDay();

  // Monday as start of week
  const monday = new Date(selected);
  monday.setDate(selected.getDate() - dow + (dow === 0 ? -6 : 1));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  setTempStartDate(monday.toISOString().split("T")[0]);
  setTempEndDate(sunday.toISOString().split("T")[0]);
};

  /* ===== FETCH DASHBOARD DATA FROM DATABASE ===== */
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/inspection/dashboard-stats', {
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
        console.error('Error fetching Inspection dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardStats();
  }, [startDate, endDate]);

  /* ===== FACTOR ===== */

const factor = useMemo(() => {
  const y = yearWeight(year);

  if (filterMode === "year") return y;

  if (filterMode === "month")
    return y * ((monthIndex(startMonth)+1)/12);

  return y * dateRangeFactor(startDate, endDate);

}, [filterMode, year, startMonth, startDate, endDate]);




  const months = monthRange(startMonth,endMonth);

  /* ================= CHART DATA (FROM DATABASE) ================= */

  const pipelineData = useMemo(() => {
    if (chartData.monthly && chartData.monthly.length > 0) {
      return chartData.monthly
        .filter(item => months.includes(item.month))
        .map(item => ({
          month: item.month,
          received: item.received || 0,
          pending: item.pending || 0,
          inspected: item.inspected || 0,
          returned: item.returned || 0,
        }));
    }
    return months.map((m) => ({
      month: m,
      received: 0,
      pending: 0,
      inspected: 0,
      returned: 0,
    }));
  }, [chartData.monthly, months]);

  // Derive intakeTrend from pipelineData for consistency
  const intakeTrend = useMemo(() => {
    return pipelineData.map(item => ({
      month: item.month,
      received: item.received || 0,
    }));
  }, [pipelineData]);

  /* ================= KPIs (COMPUTED FROM CHART DATA FOR ALIGNMENT) ================= */

  // Compute KPIs as sum of pipelineData to ensure alignment with charts
  const kpis = useMemo(() => {
    const totals = pipelineData.reduce((acc, month) => ({
      received: acc.received + (month.received || 0),
      inspected: acc.inspected + (month.inspected || 0),
      pending: acc.pending + (month.pending || 0),
      returned: acc.returned + (month.returned || 0),
    }), { received: 0, inspected: 0, pending: 0, returned: 0 });
    
    const successRate = totals.received > 0 
      ? Math.round((totals.inspected / totals.received) * 100) 
      : 0;
    
    return {
      received: totals.received,
      inspected: totals.inspected,
      pending: totals.pending,
      returned: totals.returned,
      success: successRate,
    };
  }, [pipelineData]);

  // Derive inspectedVolume from pipelineData to ensure consistency
  const inspectedVolume = useMemo(() => {
    return pipelineData.map(item => ({
      month: item.month,
      inspected: item.inspected || 0,
    }));
  }, [pipelineData]);

  const pieData = [
    { name: "Inspected (Passed)", value: kpis.inspected },
    { name: "Returned", value: kpis.returned }
  ];

  const kpiCards = useMemo(() => ([
    {
      id: "received",
      title: "Received from GSPS",
      value: kpis.received,
      sourceLabel: "List of Serials",
      sourcePath: "/inspection-serials",
      chartIds: ["intake", "pipeline"],
    },
    {
      id: "inspected",
      title: "Inspected (Passed)",
      value: kpis.inspected,
      sourceLabel: "Serials for Inspection",
      sourcePath: "/inspection-serialsforinspection",
      chartIds: ["pipeline", "monthlyInspected", "outcome"],
    },
    {
      id: "returned",
      title: "Returned (Damaged)",
      value: kpis.returned,
      sourceLabel: "Serials for Inspection",
      sourcePath: "/inspection-serialsforinspection",
      chartIds: ["pipeline", "outcome"],
    },
    {
      id: "pending",
      title: "Pending Inspection",
      value: kpis.pending,
      sourceLabel: "Serials for Inspection",
      sourcePath: "/inspection-serialsforinspection",
      chartIds: ["pipeline"],
    },
    {
      id: "success",
      title: "Inspection Success Rate",
      value: `${kpis.success}%`,
      sourceLabel: "Serials for Inspection",
      sourcePath: "/inspection-serialsforinspection",
      chartIds: ["monthlyInspected", "outcome"],
    },
  ]), [kpis]);

  const selectedKpi = activeKpi
    ? kpiCards.find((card) => card.id === activeKpi) || null
    : null;
  const visibleKpiCards = selectedKpi ? [selectedKpi] : kpiCards;
  const shouldShowChart = (chartId) => !selectedKpi || selectedKpi.chartIds.includes(chartId);

  /* ================= UI ================= */

  return (
    <InspectionLayout>
      <Head title="Inspection Dashboard" />

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
                    const response = await axios.get('/api/inspection/export-report', {
                      params: {
                        start_date: startDate,
                        end_date: endDate,
                        dashboard_name: 'Inspection Dashboard',
                      },
                      responseType: 'blob',
                    });
                    const blob = new Blob([response.data], {
                      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Inspection_Dashboard_Report_${startDate}_to_${endDate}.csv`;
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


        {/* KPIs */}
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

        <div className={`grid gap-4 ${selectedKpi ? "md:grid-cols-1" : "md:grid-cols-5"}`}>
          {visibleKpiCards.map((card) => (
            <KPI
              key={card.id}
              title={card.title}
              value={card.value}
              sourceLabel={card.sourceLabel}
              isActive={card.id === activeKpi}
              onSelect={() => setActiveKpi((prev) => prev === card.id ? null : card.id)}
              onSeeMore={() => router.visit(card.sourcePath)}
            />
          ))}
        </div>

        {/* CHARTS */}
        <div className="grid md:grid-cols-2 gap-6">

          {shouldShowChart("intake") && (
          <Chart title="Inspection Intake Trend">
            <ResponsiveContainer height={300}>
              <LineChart data={intakeTrend}>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Tooltip/>
                <Line dataKey="received" stroke="#2563eb" strokeWidth={3} dot={{ r: 6 }} isAnimationActive={false}/>
              </LineChart>
            </ResponsiveContainer>
          </Chart>
          )}

      {shouldShowChart("pipeline") && (
      <Chart title="Inspection Pipeline Status">
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
        dataKey="received"
        stackId="1"
        stroke={COLORS.received}
        fill={COLORS.received}
        name="Received"
        dot={{ r: 4 }}
        isAnimationActive={false}
      />

      <Area
        type="monotone"
        dataKey="pending"
        stackId="1"
        stroke={COLORS.pending}
        fill={COLORS.pending}
        name="Pending"
        dot={{ r: 4 }}
        isAnimationActive={false}
      />

      <Area
        type="monotone"
        dataKey="inspected"
        stackId="1"
        stroke={COLORS.inspected}
        fill={COLORS.inspected}
        name="Inspected"
        dot={{ r: 4 }}
        isAnimationActive={false}
      />

      <Area
        type="monotone"
        dataKey="returned"
        stackId="1"
        stroke={COLORS.returned}
        fill={COLORS.returned}
        name="Returned"
        dot={{ r: 4 }}
        isAnimationActive={false}
      />

    </AreaChart>
  </ResponsiveContainer>
</Chart>
      )}


          {shouldShowChart("monthlyInspected") && (
          <Chart title="Monthly Inspected Volume">
            <ResponsiveContainer height={300}>
              <BarChart data={inspectedVolume}>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="inspected" fill="#2563eb"/>
              </BarChart>
            </ResponsiveContainer>
          </Chart>
          )}

          {shouldShowChart("outcome") && (
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
          )}

        </div>
      </div>
    </InspectionLayout>
  );
}

/* UI */

const KPI = ({title, value, sourceLabel, isActive, onSelect, onSeeMore}) => (
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
    className={`bg-white p-5 rounded-xl shadow border cursor-pointer transition ${isActive ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-blue-200"}`}
  >
    <p className="text-sm text-gray-600">{title}</p>
    <p className="text-3xl font-bold">{value}</p>
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

const Chart = ({title,children}) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <h3 className="font-bold mb-4">{title}</h3>
    {children}
  </div>
);
