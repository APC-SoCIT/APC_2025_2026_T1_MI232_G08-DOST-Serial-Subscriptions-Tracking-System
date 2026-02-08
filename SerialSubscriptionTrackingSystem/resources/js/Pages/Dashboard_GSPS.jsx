import React, { useState, useMemo } from "react";
import GSPSLayout from "@/Layouts/GSPSLayout";
import { Head } from "@inertiajs/react";
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

const COLORS = {
  received: "#2563eb",
  pending: "#facc15",
  forwarded: "#22c55e",
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
  ({2022:0.85, 2023:0.95, 2024:1, 2025:1.1}[year] || 1);

const dateRangeFactor = (start, end) => {
  const diff = (new Date(end) - new Date(start)) / (1000*60*60*24);
  return Math.min(Math.max(diff/365, 0.1), 1);
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
    <text x={x} y={y} fill="#fff" textAnchor="middle">
      {(percent*100).toFixed(0)}%
    </text>
  );
};

/* ================= COMPONENT ================= */

export default function DashboardGSPS() {

  /* ===== FILTER STATE (APPLIED) ===== */

  const [filterMode, setFilterMode] = useState("year");
  const [year, setYear] = useState(2025);
  const [startMonth, setStartMonth] = useState("January");
  const [endMonth, setEndMonth] = useState("December");
  const [startDate, setStartDate] = useState(firstDayOfMonth(2025,"January"));
  const [endDate, setEndDate] = useState(lastDayOfMonth(2025,"December"));
  const [showFilter, setShowFilter] = useState(false);

  /* ===== TEMP STATE ===== */

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

  /* ===== FACTOR ===== */

  const factor = useMemo(()=>{
    const y = yearWeight(year);
    if(filterMode==="year") return y;
    if(filterMode==="month")
      return y * ((monthIndex(startMonth)+1)/12);

    return y * dateRangeFactor(startDate,endDate);
  },[filterMode,year,startMonth,startDate,endDate]);
  /* ================= GSPS PERFORMANCE MODEL ================= */

// Base handling efficiency improves yearly
const baseEfficiency =
  year === 2022 ? 0.82 :
  year === 2023 ? 0.85 :
  year === 2024 ? 0.88 :
  year === 2025 ? 0.92 :
  0.88;

// Smaller ranges = more variability
const rangeImpact =
  filterMode === "year" ? 1 :
  filterMode === "month" ? 0.97 :
  filterMode === "week" ? 0.94 :
  0.95;

// Date span impact
const spanImpact = dateRangeFactor(startDate, endDate);

// Normalize so efficiency stays realistic
const normalizedSpan = 0.9 + (spanImpact * 0.1);

// Final efficiency
const efficiency = baseEfficiency * rangeImpact * normalizedSpan;


  const months = monthRange(startMonth,endMonth);

  /* ================= KPIs ================= */

 const kpis = useMemo(()=>{
  const received = Math.round(150 * factor);

  // Forwarded depends on efficiency
  const forwarded = Math.round(received * efficiency);

  // Returned increases when efficiency drops
  const returned = Math.round(received * (1 - efficiency) * 0.8);

  const pending = Math.max(received - forwarded - returned,0);

  return {
    received,
    forwarded,
    pending,
    returned,
    success: Math.round((forwarded/Math.max(received,1))*100)
  };
},[factor, efficiency]);



  /* ================= CHART DATA ================= */

  const intakeTrend = months.map((m,i)=>({
    month:m,
    received: Math.round((10+i*2)*factor)
  }));

  const pipelineData = months.map((m,i)=>({
    month:m,
    received: Math.round((12+i)*factor),
    pending: Math.round((3-i*0.2)*factor),
    forwarded: Math.round((10+i)*factor),
    returned: Math.round((1+i*0.1)*factor)
  }));

  const forwardedMonthly = months.map((m,i)=>({
    month:m,
    forwarded: Math.round((9+i*1.5)*factor)
  }));

  const pieData = [
  { name:"Forwarded", value:kpis.forwarded },
  { name:"Returned", value:kpis.returned }
];

  /* ================= UI ================= */

  return (
    <GSPSLayout>
      <Head title="GSPS Dashboard" />

      <div className="space-y-6">

        {/* ===== FILTER HEADER ===== */}
        <div className="relative bg-white p-5 rounded-xl shadow flex justify-between items-center">
          <h2 className="text-xl font-bold">Filter by</h2>

          <div className="flex gap-2">
            {["year","month","week","custom"].map(mode=>(
              <button
                key={mode}
                onClick={()=>{
                  setFilterMode(mode);
                  setShowFilter(true);

                  setTempYear(year);
                  setTempStartMonth(startMonth);
                  setTempStartDate(startDate);
                  setTempEndDate(endDate);

                  setCalendarYear(year);
                  setCalendarMonth(monthIndex(startMonth));
                }}
                className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 font-semibold"
              >
                {mode.charAt(0).toUpperCase()+mode.slice(1)}
              </button>
            ))}
          </div>

          {/* ===== POPUP ===== */}
          {showFilter && (
            <div className="absolute right-0 top-16 w-[380px] bg-white border rounded-xl shadow-2xl p-5 space-y-4 z-50">

              <div className="flex justify-between">
                <h3 className="font-bold">Filter by</h3>
                <button onClick={()=>setShowFilter(false)}>×</button>
              </div>

              {/* MODE TABS */}
              <div className="flex gap-2">
                {["year","month","week","custom"].map(mode=>(
                  <button
                    key={mode}
                    onClick={()=>setFilterMode(mode)}
                    className={`px-3 py-1 rounded-full text-sm font-semibold
                      ${filterMode===mode?"bg-green-700 text-white":"bg-gray-100"}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* YEAR */}
              {filterMode==="year" && (
                <div className="grid grid-cols-3 gap-2">
                  {YEARS.map(y=>(
                    <button
                      key={y}
                      onClick={()=>setTempYear(y)}
                      className={`p-2 rounded border
                        ${tempYear===y?"bg-green-700 text-white":"bg-gray-100"}`}
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
                      onClick={()=>{
                        setTempStartMonth(m);
                        setTempStartDate(firstDayOfMonth(tempYear,m));
                        setTempEndDate(lastDayOfMonth(tempYear,m));
                      }}
                      className={`p-2 text-sm rounded border
                        ${tempStartMonth===m?"bg-green-700 text-white":"bg-gray-100"}`}
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
                  <input type="date" value={tempStartDate}
                    onChange={e=>setTempStartDate(e.target.value)}
                    className="border p-2 rounded"/>
                  <input type="date" value={tempEndDate}
                    onChange={e=>setTempEndDate(e.target.value)}
                    className="border p-2 rounded"/>
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

        {/* ===== KPIs ===== */}
        <div className="grid md:grid-cols-5 gap-4">
          <KPI title="Received Deliveries" value={kpis.received}/>
          <KPI title="Forwarded to Inspection" value={kpis.forwarded}/>
          <KPI title="Pending Forwarding" value={kpis.pending}/>
          <KPI title="Returned / Issues" value={kpis.returned}/>
          <KPI title="Handling Success Rate" value={`${kpis.success}%`}/>
        </div>

        {/* ===== CHARTS ===== */}
        <div className="grid md:grid-cols-2 gap-6">

          <Chart title="Delivery Intake Trend">
            <ResponsiveContainer height={280}>
              <LineChart data={intakeTrend}>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Tooltip/>
                <Line type="monotone" dataKey="received" stroke={COLORS.received} strokeWidth={3}/>
              </LineChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Delivery Pipeline Status">
            <ResponsiveContainer height={280}>
              <AreaChart data={pipelineData}>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Tooltip/>
                <Legend/>
                <Area dataKey="received" stackId="1" fill={COLORS.received} stroke={COLORS.received}/>
                <Area dataKey="pending" stackId="1" fill={COLORS.pending} stroke={COLORS.pending}/>
                <Area dataKey="forwarded" stackId="1" fill={COLORS.forwarded} stroke={COLORS.forwarded}/>
                <Area dataKey="returned" stackId="1" fill={COLORS.returned} stroke={COLORS.returned}/>
              </AreaChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Monthly Forwarded to Inspection">
            <ResponsiveContainer height={280}>
              <BarChart data={forwardedMonthly}>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="forwarded" fill={COLORS.received}/>
              </BarChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Inspection Handover Outcome">
            <ResponsiveContainer height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={40}
                  outerRadius={90}
                  label={renderPieLabel}
                  labelLine={false}
                >
                  <Cell fill={COLORS.forwarded}/>
                  <Cell fill={COLORS.returned}/>
                </Pie>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </Chart>

        </div>
      </div>
    </GSPSLayout>
  );
}

/* ================= UI ================= */

const KPI = ({title,value}) => (
  <div className="bg-white p-5 rounded-xl shadow">
    <p className="text-sm font-semibold text-gray-600">{title}</p>
    <p className="text-3xl font-extrabold">{value}</p>
  </div>
);

const Chart = ({title,children}) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <h3 className="font-bold mb-4">{title}</h3>
    {children}
  </div>
);
