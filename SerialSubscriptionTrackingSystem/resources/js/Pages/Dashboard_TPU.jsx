import React, { useState, useMemo, useEffect } from "react";
import TPULayout from "@/Layouts/TPULayout";
import { Head } from "@inertiajs/react";
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar, LabelList,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

/* ================= CONSTANTS ================= */

const YEARS = [2022, 2023, 2024, 2025];
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

  /* ===== FILTER STATE ===== */

  const [filterMode, setFilterMode] = useState("year");       // applied
const [tempFilterMode, setTempFilterMode] = useState("year"); // popup

  const [year, setYear] = useState(2025);
  const [startMonth, setStartMonth] = useState("January");
  const [endMonth, setEndMonth] = useState("December");
  const [startDate, setStartDate] = useState(firstDayOfMonth(2025,"January"));
  const [endDate, setEndDate] = useState(lastDayOfMonth(2025,"December"));

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

  /* ================= KPI ================= */

const total = Math.round(320 * filterFactor);

// Base efficiency reacts to filter mode
let baseEfficiency =
  filterMode === "week" ? 0.75 :
  filterMode === "month" ? 0.8 :
  filterMode === "custom" ? 0.78 :
  0.82;

// Year impact (performance improves over years)
const yearEfficiencyFactor =
  year === 2022 ? 0.9 :
  year === 2023 ? 0.95 :
  year === 2024 ? 1 :
  year === 2025 ? 1.05 :
  1;

// Final efficiency
const deliveryEfficiency = baseEfficiency * yearEfficiencyFactor;

// Cap at realistic range
const delivered = Math.round(
  total * Math.min(deliveryEfficiency, 0.98)
);



  const kpis = {
  total,
  delivered,
  awaiting: Math.round(35 * filterFactor),
  returned: Math.round(25 * filterFactor),
  inspected: Math.round(250 * filterFactor),
  success: Math.round((delivered / Math.max(total,1)) * 100)
};

  /* ================= CHART DATA ================= */

  const pipelineData = months.map((m,i)=>({
    month:m,
    awarded: Math.round((30+i*2) * filterFactor),
    delivered: Math.round((25+i*2) * filterFactor),
    forDelivery: Math.round((15+i) * filterFactor),
    inspected: Math.round((10+i) * filterFactor),
    returned: Math.round((5+i*0.5) * filterFactor)
  }));

  const deliveryTrend = months.map((m,i)=>({
    month:m,
    delivered: Math.round((15+i*1.5) * filterFactor)
  }));

  const supplierRanking = [
    { name:"ABC Books", value: Math.min(100, Math.round(98 * filterFactor)) },
    { name:"Med Pub Ltd", value: Math.min(100, Math.round(95 * filterFactor)) },
    { name:"Global Periodicals", value: Math.min(100, Math.round(80 * filterFactor)) },
    { name:"Nat Geo", value: Math.min(100, Math.round(72 * filterFactor)) }
  ];

  const inspectionPie = [
    { name:"Inspected", value: Math.round(275 * filterFactor) },
    { name:"Returned", value: Math.round(22 * filterFactor) }
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

        {/* FILTER HEADER */}
        <div className="relative bg-white p-5 rounded-xl shadow flex justify-between items-center">
          <h2 className="text-xl font-bold">Filter by</h2>

          <div className="flex gap-2">
            {["year","month","week","custom"].map(mode=>(
              <button
                key={mode}
                onClick={()=>{ setFilterMode(mode); setShowFilter(true); }}
                className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 font-semibold"
              >
                {mode.charAt(0).toUpperCase()+mode.slice(1)}
              </button>
            ))}
          </div>

          {/* POPUP */}
          {showFilter && (
            <div className="absolute right-0 top-16 w-[380px] bg-white border rounded-xl shadow-2xl p-5 space-y-4 z-50">

              <div className="flex justify-between">
                <h3 className="font-bold">Filter by</h3>
                <button onClick={()=>setShowFilter(false)}>×</button>
              </div>

              {/* YEAR */}
              {filterMode==="year" && (
                <div className="grid grid-cols-3 gap-2">
                  {YEARS.map(y=>(
                    <button
                      key={y}
                      onClick={()=>setTempYear(y)}
                      className={`p-2 rounded border ${tempYear===y ? "bg-green-700 text-white":"bg-gray-100"}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}

              {/* MONTH */}
              {filterMode==="month" && (
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-auto">
                  {MONTHS.map(m=>(
                    <button
                      key={m}
                      onClick={()=>setTempStartMonth(m)}
                      className={`p-2 text-sm rounded border ${tempStartMonth===m ? "bg-green-700 text-white":"bg-gray-100"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}

              {/* WEEK */}
              {filterMode==="week" && (
                <div className="space-y-3">
                  <div className="flex justify-between font-semibold">
                    <button onClick={()=>setCalendarMonth(p=>p===0?11:p-1)}>←</button>
                    <span>{MONTHS[calendarMonth]} {calendarYear}</span>
                    <button onClick={()=>setCalendarMonth(p=>p===11?0:p+1)}>→</button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center">
                    {getDaysInMonth(calendarYear,calendarMonth).map((day,i)=>(
                      <button
                        key={i}
                        disabled={!day}
                        onClick={()=>day && selectWeek(day)}
                        className={`p-2 rounded text-sm ${day?"hover:bg-green-100":""}`}
                      >
                        {day || ""}
                      </button>
                    ))}
                  </div>

                  <div className="text-sm text-gray-600">
                    {tempStartDate} → {tempEndDate}
                  </div>
                </div>
              )}

              {/* CUSTOM */}
              {filterMode==="custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={tempStartDate} onChange={e=>setTempStartDate(e.target.value)} className="border p-2 rounded"/>
                  <input type="date" value={tempEndDate} onChange={e=>setTempEndDate(e.target.value)} className="border p-2 rounded"/>
                </div>
              )}

              <button
                onClick={applyFilter}
                className="w-full bg-green-800 text-white py-3 rounded-lg font-bold"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-6 gap-4">
          <KPI title="Total Serials Encoded" value={kpis.total}/>
          <KPI title="Delivered to GSPS" value={kpis.delivered}/>
          <KPI title="Awaiting delivery" value={kpis.awaiting}/>
          <KPI title="Overdue / Returned" value={kpis.returned}/>
          <KPI title="Inspected" value={kpis.inspected}/>
          <KPI title="Delivery Success Rate" value={`${kpis.success}%`}/>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">

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
      />

      <Area
        type="monotone"
        dataKey="delivered"
        stackId="1"
        stroke={PIPELINE_COLORS.delivered}
        fill={PIPELINE_COLORS.delivered}
      />

      <Area
        type="monotone"
        dataKey="forDelivery"
        stackId="1"
        stroke={PIPELINE_COLORS.forDelivery}
        fill={PIPELINE_COLORS.forDelivery}
      />

      <Area
        type="monotone"
        dataKey="inspected"
        stackId="1"
        stroke={PIPELINE_COLORS.inspected}
        fill={PIPELINE_COLORS.inspected}
      />

      <Area
        type="monotone"
        dataKey="returned"
        stackId="1"
        stroke={PIPELINE_COLORS.returned}
        fill={PIPELINE_COLORS.returned}
      />
    </AreaChart>
  </ResponsiveContainer>
</Chart>



          <Chart title="Delivery Performance Trend">
            <ResponsiveContainer height={300}>
              <LineChart data={deliveryTrend}>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Tooltip/>
                <Line dataKey="delivered" stroke="#2563eb" strokeWidth={3}/>
              </LineChart>
            </ResponsiveContainer>
          </Chart>

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

        </div>
      </div>
    </TPULayout>
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
