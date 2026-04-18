import React, { useState, useMemo, useEffect } from "react";
import TPULayout from "@/Layouts/TPULayout";
import { Head, router } from "@inertiajs/react";
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaFilter, FaFileExcel } from 'react-icons/fa';
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar, LabelList,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

/* ================= CONSTANTS ================= */

const YEARS = [2022, 2023, 2024, 2025, 2026];
const PIPELINE_COLORS = {
  awarded: "#3b82f6",     // Blue
  delivered: "#22c55e",   // Green
  forDelivery: "#facc15", // Yellow
  inspected: "#a855f7",   // Purple
  returned: "#ef4444"     // Red
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

/* ================= HELPERS ================= */

const monthIndex = (m) => MONTHS.indexOf(m);

const monthRange = (start, end) =>
  MONTHS.slice(monthIndex(start), monthIndex(end) + 1);

const firstDayOfMonth = (year, month) =>
  `${year}-${String(monthIndex(month)+1).padStart(2,"0")}-01`;

const lastDayOfMonth = (year, month) =>
  new Date(year, monthIndex(month)+1, 0).toISOString().split("T")[0];

const yearWeight = (year) =>
  ({2022:0.85, 2023:0.95, 2024:1, 2025:1.1}[year] || 1);

const dateRangeFactor = (startDate, endDate) => {
  const diff =
    (new Date(endDate) - new Date(startDate)) /
    (1000*60*60*24);
  return Math.max(diff/365, 0.15);
};

/* ===== WEEK HELPERS ===== */

const getDaysInMonth = (year, month) => {
  const days = [];
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);

  return days;
};

export default function TPUDashboard() {

  /* ===== DASHBOARD DATA FROM DATABASE ===== */
  const [dashboardStats, setDashboardStats] = useState({
    total_serials: 0,
    awarded: 0,
    delivered: 0,
    for_delivery: 0,
    inspected: 0,
    returned: 0,
    pending: 0,
    prepare: 0,
    efficiency: 0,
  });
  const [chartData, setChartData] = useState({ monthly: [], pipeline: [] });
  const [isLoading, setIsLoading] = useState(true);

  /* ===== FILTER STATE ===== */

  const [filterMode, setFilterMode] = useState("year");       // applied
const [tempFilterMode, setTempFilterMode] = useState("year"); // popup

  const [year, setYear] = useState(2026);
  const [startMonth, setStartMonth] = useState("January");
  const [endMonth, setEndMonth] = useState("December");
  const [startDate, setStartDate] = useState(firstDayOfMonth(2026,"January"));
  const [endDate, setEndDate] = useState(lastDayOfMonth(2026,"December"));
  const [activeKpi, setActiveKpi] = useState(null);

  const [showFilter, setShowFilter] = useState(false);

  /* ===== TEMP STATES ===== */

  const [tempYear, setTempYear] = useState(year);
  const [tempStartMonth, setTempStartMonth] = useState(startMonth);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  /* ===== ADMIN SYNC: when popup opens ===== */
useEffect(() => {
  if (showFilter) {
    setTempYear(year);
    setTempStartMonth(startMonth);
    setTempStartDate(startDate);
    setTempEndDate(endDate);

    // Sync calendar for week view
    setCalendarYear(year);
    setCalendarMonth(monthIndex(startMonth));
  }
}, [showFilter]);

  // AUTO-SYNC: When YEAR changes in Year mode → full year range
useEffect(() => {
  if (filterMode === "year") {
    setTempStartDate(firstDayOfMonth(tempYear, "January"));
    setTempEndDate(lastDayOfMonth(tempYear, "December"));
    setTempStartMonth("January");
  }
}, [tempYear, filterMode]);

// AUTO-SYNC: When MONTH changes → update dates for that month
useEffect(() => {
  if (filterMode === "month") {
    setTempStartDate(firstDayOfMonth(tempYear, tempStartMonth));
    setTempEndDate(lastDayOfMonth(tempYear, tempStartMonth));
  }
}, [tempStartMonth, tempYear, filterMode]);

// AUTO-SYNC calendar when year/month changes (for week view)
useEffect(() => {
  if (filterMode === "week") {
    setCalendarYear(tempYear);
    setCalendarMonth(monthIndex(tempStartMonth));
  }
}, [tempYear, tempStartMonth, filterMode]);


  /* ===== WEEK STATE ===== */

  const [calendarMonth, setCalendarMonth] = useState(monthIndex(startMonth));
  const [calendarYear, setCalendarYear] = useState(year);

  const selectWeek = (day) => {
    const selected = new Date(calendarYear, calendarMonth, day);
    const dayOfWeek = selected.getDay();
    const monday = new Date(selected);
    monday.setDate(selected.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
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
        const response = await axios.get('/api/tpu/dashboard-stats', {
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
        console.error('Error fetching TPU dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardStats();
  }, [startDate, endDate]);

  /* ================= MASTER FACTOR ================= */

  const filterFactor = useMemo(() => {
    const yFactor = yearWeight(year);

    if (filterMode === "year") return yFactor;

    if (filterMode === "month") {
      return yFactor * ((monthIndex(startMonth)+1)/12);
    }

    // week & custom
    return yFactor * dateRangeFactor(startDate, endDate);

  }, [filterMode, year, startMonth, startDate, endDate]);

  const months = monthRange(startMonth, endMonth);

  /* ================= APPLY FILTER ================= */

  const applyFilter = () => {
    setYear(tempYear);

    if (filterMode === "year") {
      setStartMonth("January");
      setEndMonth("December");
      setStartDate(firstDayOfMonth(tempYear,"January"));
      setEndDate(lastDayOfMonth(tempYear,"December"));
    }

  if (filterMode === "month") {
  setStartMonth(tempStartMonth);
  setEndMonth(tempStartMonth);
  setStartDate(tempStartDate);
  setEndDate(tempEndDate);
}


    if (filterMode === "week" || filterMode === "custom") {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);

      const s = new Date(tempStartDate);
      const e = new Date(tempEndDate);

      setStartMonth(MONTHS[s.getMonth()]);
      setEndMonth(MONTHS[e.getMonth()]);
    }

    setShowFilter(false);
  };

  /* ================= CHART DATA (FROM DATABASE) ================= */

  // Use chart data from database or generate fallback
  const pipelineData = useMemo(() => {
    if (chartData.monthly && chartData.monthly.length > 0) {
      return chartData.monthly.filter(item => months.includes(item.month));
    }
    // Fallback to placeholder data
    return months.map((m) => ({
      month: m,
      awarded: 0,
      delivered: 0,
      forDelivery: 0,
      inspected: 0,
      returned: 0,
    }));
  }, [chartData.monthly, months]);

  /* ================= KPI (COMPUTED FROM CHART DATA FOR ALIGNMENT) ================= */

  // Compute KPIs as sum of chart data to ensure alignment
  const kpis = useMemo(() => {
    const totals = pipelineData.reduce((acc, month) => ({
      awarded: acc.awarded + (month.awarded || 0),
      delivered: acc.delivered + (month.delivered || 0),
      forDelivery: acc.forDelivery + (month.forDelivery || 0),
      inspected: acc.inspected + (month.inspected || 0),
      returned: acc.returned + (month.returned || 0),
    }), { awarded: 0, delivered: 0, forDelivery: 0, inspected: 0, returned: 0 });
    
    const successRate = totals.awarded > 0 
      ? Math.round((totals.inspected / totals.awarded) * 100) 
      : 0;
    
    return {
      total: totals.awarded,
      delivered: totals.delivered,
      awaiting: totals.forDelivery,
      returned: totals.returned,
      inspected: totals.inspected,
      pending: dashboardStats.pending || 0,
      prepare: dashboardStats.prepare || 0,
      success: successRate,
    };
  }, [pipelineData, dashboardStats]);

  // Derive deliveryTrend from pipelineData to ensure consistency
  const deliveryTrend = useMemo(() => {
    return pipelineData.map(item => ({
      month: item.month,
      delivered: item.delivered || 0,
    }));
  }, [pipelineData]);

  // Use computed KPIs for pie chart to ensure alignment
  const inspectionPie = useMemo(() => {
    return [
      { name: "Inspected", value: kpis.inspected || 0 },
      { name: "Returned", value: kpis.returned || 0 },
    ];
  }, [kpis]);

  const kpiCards = useMemo(() => ([
    {
      id: "total",
      title: "Total Serials Encoded",
      value: kpis.total,
      sourceLabel: "Subscription",
      sourcePath: "/dashboard-tpu-subscriptiontracking",
      chartIds: ["pipeline", "supplierRanking"],
    },
    {
      id: "delivered",
      title: "Delivered to GSPS",
      value: kpis.delivered,
      sourceLabel: "Monitor Delivery",
      sourcePath: "/dashboard-tpu-monitordelivery",
      chartIds: ["pipeline", "deliveryTrend"],
    },
    {
      id: "awaiting",
      title: "Awaiting delivery",
      value: kpis.awaiting,
      sourceLabel: "Monitor Delivery",
      sourcePath: "/dashboard-tpu-monitordelivery",
      chartIds: ["pipeline"],
    },
    {
      id: "returned",
      title: "Overdue / Returned",
      value: kpis.returned,
      sourceLabel: "Monitor Delivery",
      sourcePath: "/dashboard-tpu-monitordelivery",
      chartIds: ["pipeline", "inspectionOutcomes"],
    },
    {
      id: "inspected",
      title: "Inspected",
      value: kpis.inspected,
      sourceLabel: "Monitor Delivery",
      sourcePath: "/dashboard-tpu-monitordelivery",
      chartIds: ["pipeline", "inspectionOutcomes"],
    },
    {
      id: "success",
      title: "Delivery Success Rate",
      value: `${kpis.success}%`,
      sourceLabel: "Monitor Delivery",
      sourcePath: "/dashboard-tpu-monitordelivery",
      chartIds: ["deliveryTrend", "inspectionOutcomes", "supplierRanking"],
    },
  ]), [kpis]);

  const selectedKpi = activeKpi
    ? kpiCards.find((card) => card.id === activeKpi) || null
    : null;
  const visibleKpiCards = selectedKpi ? [selectedKpi] : kpiCards;
  const shouldShowChart = (chartId) => !selectedKpi || selectedKpi.chartIds.includes(chartId);

  const supplierRanking = [
    { name:"ABC Books", value: 100 },
    { name:"Med Pub Ltd", value: 95 },
    { name:"Global Periodicals", value: 80 },
    { name:"Nat Geo", value: 72 }
  ];

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI/180;
    const radius = innerRadius + (outerRadius-innerRadius)*0.6;
    const x = cx + radius*Math.cos(-midAngle*RADIAN);
    const y = cy + radius*Math.sin(-midAngle*RADIAN);

    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="bold">
        {(percent*100).toFixed(0)}%
      </text>
    );
  };

  /* ================= UI ================= */

  return (
    <TPULayout>
      <Head title="TPU Dashboard" />

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
                    const response = await axios.get('/api/tpu/export-report', {
                      params: {
                        start_date: startDate,
                        end_date: endDate,
                        dashboard_name: 'TPU Dashboard',
                      },
                      responseType: 'blob',
                    });
                    const blob = new Blob([response.data], {
                      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `TPU_Dashboard_Report_${startDate}_to_${endDate}.csv`;
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

        <div className={`grid gap-4 ${selectedKpi ? "md:grid-cols-1" : "md:grid-cols-6"}`}>
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

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">

 {shouldShowChart("pipeline") && (
 <Chart title="Serial Pipeline Status">
  <ResponsiveContainer height={300}>
    <AreaChart data={pipelineData}>
      <XAxis dataKey="month"/>
      <YAxis/>
      <Tooltip/>

      {/* Legend uses same colors */}
      <Legend 
  verticalAlign="bottom"
  height={36}
/>

      <Area
        type="monotone"
        dataKey="awarded"
        stackId="1"
        stroke={PIPELINE_COLORS.awarded}
        fill={PIPELINE_COLORS.awarded}
        dot={{ r: 4 }}
        isAnimationActive={false}
      />

      <Area
        type="monotone"
        dataKey="delivered"
        stackId="1"
        stroke={PIPELINE_COLORS.delivered}
        fill={PIPELINE_COLORS.delivered}
        dot={{ r: 4 }}
        isAnimationActive={false}
      />

      <Area
        type="monotone"
        dataKey="forDelivery"
        stackId="1"
        stroke={PIPELINE_COLORS.forDelivery}
        fill={PIPELINE_COLORS.forDelivery}
        dot={{ r: 4 }}
        isAnimationActive={false}
      />

      <Area
        type="monotone"
        dataKey="inspected"
        stackId="1"
        stroke={PIPELINE_COLORS.inspected}
        fill={PIPELINE_COLORS.inspected}
        dot={{ r: 4 }}
        isAnimationActive={false}
      />

      <Area
        type="monotone"
        dataKey="returned"
        stackId="1"
        stroke={PIPELINE_COLORS.returned}
        fill={PIPELINE_COLORS.returned}
        dot={{ r: 4 }}
        isAnimationActive={false}
      />
    </AreaChart>
  </ResponsiveContainer>
</Chart>
 )}


          {shouldShowChart("deliveryTrend") && (
          <Chart title="Delivery Performance Trend">
            <ResponsiveContainer height={300}>
              <LineChart data={deliveryTrend}>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Tooltip/>
                <Line dataKey="delivered" stroke="#2563eb" strokeWidth={3} dot={{ r: 6 }} isAnimationActive={false}/>
              </LineChart>
            </ResponsiveContainer>
          </Chart>
          )}

          {shouldShowChart("supplierRanking") && (
          <Chart title="Supplier Reliability Ranking">
            <ResponsiveContainer height={300}>
              <BarChart data={supplierRanking} layout="vertical">
                <XAxis type="number" domain={[0,100]} tickFormatter={(v)=>`${v}%`}/>
                <YAxis dataKey="name" type="category"/>
                <Tooltip formatter={(v)=>`${v}%`}/>
                <Bar dataKey="value" fill="#2563eb">
                  <LabelList dataKey="value" position="right" formatter={(v)=>`${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Chart>
          )}

          {shouldShowChart("inspectionOutcomes") && (
          <Chart title="Inspection Outcomes">
            <ResponsiveContainer height={300}>
              <PieChart>
                <Pie
                  data={inspectionPie}
                  dataKey="value"
                  cx="50%" cy="50%"
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
    </TPULayout>
  );
}

/* ================= UI ================= */

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
