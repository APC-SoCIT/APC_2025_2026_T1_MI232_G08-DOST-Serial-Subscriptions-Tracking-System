import React, { useState, useMemo, useEffect } from "react";
import GSPSLayout from "@/Layouts/GSPSLayout";
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
const PIE_COLORS = {
  forwarded: "#2563eb", // blue
  returned: "#ef4444",  // red
};
const PIPELINE_COLORS = {
  received: "#2563eb",   // blue
  pending: "#facc15",    // yellow
  forwarded: "#22c55e",  // green
  returned: "#ef4444",   // red
};

const COLORS = ["#2563eb", "#22c55e", "#facc15", "#ef4444"];

/* ================= HELPERS ================= */

const monthIndex = (m) => MONTHS.indexOf(m);

const monthRange = (start, end) =>
  MONTHS.slice(monthIndex(start), monthIndex(end) + 1);

const firstDayOfMonth = (year, month) =>
  `${year}-${String(monthIndex(month) + 1).padStart(2, "0")}-01`;

const lastDayOfMonth = (year, month) =>
  new Date(year, monthIndex(month) + 1, 0).toISOString().split("T")[0];

const yearWeight = (year) =>
  ({ 2022: 0.85, 2023: 0.95, 2024: 1.0, 2025: 1.1 }[year] || 1);

const dateRangeFactor = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  const diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
  return Math.min(Math.max(diff / 365, 0.1), 1);
};

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + r * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + r * Math.sin(-midAngle * Math.PI / 180);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central">
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

/* ================= COMPONENT ================= */

export default function DashboardGSPS() {
  const [year, setYear] = useState(2025);
  const [startMonth, setStartMonth] = useState("January");
  const [endMonth, setEndMonth] = useState("December");
  const [startDate, setStartDate] = useState(firstDayOfMonth(2025, "January"));
  const [endDate, setEndDate] = useState(lastDayOfMonth(2025, "December"));

  useEffect(() => {
    setStartDate(firstDayOfMonth(year, startMonth));
  }, [year, startMonth]);

  useEffect(() => {
    setEndDate(lastDayOfMonth(year, endMonth));
  }, [year, endMonth]);

  const months = monthRange(startMonth, endMonth);
  const yFactor = yearWeight(year);
  const dFactor = dateRangeFactor(startDate, endDate);
  const factor = yFactor * dFactor;

  /* ================= KPIs ================= */

  const kpis = useMemo(() => {
    const received = Math.round(150 * factor);
    const forwarded = Math.round(135 * factor);
    const returned = Math.round(12 * factor);
    const pending = Math.max(received - forwarded - returned, 0);

    return {
      received,
      forwarded,
      pending,
      returned,
      success: received > 0 ? Math.round((forwarded / received) * 100) : 0
    };
  }, [factor]);

  /* ================= CHART DATA ================= */

  const intakeTrend = months.map((m, i) => ({
    month: m,
    received: Math.round((10 + i * 2) * factor)
  }));

  const pipelineData = months.map((m, i) => ({
    month: m,
    received: Math.round((12 + i) * factor),
    forwarded: Math.round((10 + i) * factor),
    pending: Math.round((4 - i * 0.3) * factor),
    returned: Math.round((1 + i * 0.1) * factor)
  }));

  const forwardedMonthly = months.map((m, i) => ({
    month: m,
    forwarded: Math.round((9 + i * 1.5) * factor)
  }));

  const pieData = [
    { name: "Forwarded", value: kpis.forwarded },
    { name: "Returned", value: kpis.returned }
  ];

  return (
    <GSPSLayout>
      <Head title="GSPS Dashboard" />

      <div className="space-y-6">

        {/* FILTERS */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Dashboard Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select label="Year" value={year} onChange={setYear} options={YEARS} />
            <Select label="Start Month" value={startMonth} onChange={setStartMonth} options={MONTHS} />
            <Select label="End Month" value={endMonth} onChange={setEndMonth} options={MONTHS} />
            <Input label="Start Date" value={startDate} onChange={setStartDate} />
            <Input label="End Date" value={endDate} onChange={setEndDate} />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <KPI title="Received Deliveries" value={kpis.received} />
          <KPI title="Forwarded to Inspection" value={kpis.forwarded} />
          <KPI title="Pending Forwarding" value={kpis.pending} />
          <KPI title="Returned / Issues" value={kpis.returned} />
          <KPI title="Handling Success Rate" value={`${kpis.success}%`} />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Chart title="Delivery Intake Trend">
            <ResponsiveContainer height={280}>
              <LineChart data={intakeTrend}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="received" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Delivery Pipeline Status">
     <div style={{ width: "100%", height: 300 }}>
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart
      data={pipelineData}
      margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
    >
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />

      <Area
        type="monotone"
        dataKey="received"
        stackId="1"
        stroke="#2563eb"
        fill="#2563eb"
      />

      <Area
        type="monotone"
        dataKey="pending"
        stackId="1"
        stroke="#facc15"
        fill="#facc15"
      />

      <Area
        type="monotone"
        dataKey="forwarded"
        stackId="1"
        stroke="#22c55e"
        fill="#22c55e"
      />

      <Area
        type="monotone"
        dataKey="returned"
        stackId="1"
        stroke="#ef4444"
        fill="#ef4444"
      />

      {/* ✅ Responsive legend */}
      <Legend
        verticalAlign="bottom"
        align="center"
        iconType="circle"
        wrapperStyle={{ paddingTop: 10 }}
        payload={[
          { value: "Received", color: "#2563eb", type: "circle" },
          { value: "Pending", color: "#facc15", type: "circle" },
          { value: "Forwarded", color: "#22c55e", type: "circle" },
          { value: "Returned", color: "#ef4444", type: "circle" },
        ]}
      />
    </AreaChart>
  </ResponsiveContainer>
</div>


          </Chart>

          <Chart title="Monthly Forwarded to Inspection">
            <ResponsiveContainer height={280}>
              <BarChart data={forwardedMonthly}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="forwarded" fill="#2563eb" />
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
      <Cell fill={PIE_COLORS.forwarded} />
      <Cell fill={PIE_COLORS.returned} />
    </Pie>

    {/* ✅ FORCE legend colors */}
    <Legend
      payload={[
        {
          value: "Forwarded",
          type: "square",
          color: PIE_COLORS.forwarded,
        },
        {
          value: "Returned",
          type: "square",
          color: PIE_COLORS.returned,
        },
      ]}
    />
  </PieChart>
</ResponsiveContainer>

          </Chart>

        </div>
      </div>
    </GSPSLayout>
  );
}

/* ================= UI COMPONENTS ================= */

const KPI = ({ title, value }) => (
  <div className="bg-white p-5 rounded-xl shadow">
    <p className="text-sm font-semibold text-gray-600">{title}</p>
    <p className="text-3xl font-extrabold mt-1">{value}</p>
  </div>
);

const Chart = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <h3 className="font-bold mb-4">{title}</h3>
    {children}
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div className="text-left">
    <label className="block font-semibold text-left mb-1">
      {label}
    </label>

    <Listbox value={value} onChange={onChange}>
      <Listbox.Button className="w-full border rounded px-3 py-2 text-left">
        {value}
      </Listbox.Button>

      <Listbox.Options className="absolute bg-white border rounded shadow text-left z-10">
        {options.map(o => (
          <Listbox.Option
            key={o}
            value={o}
            className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-left"
          >
            {o}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  </div>
);


const Input = ({ label, value, onChange }) => (
  <div className="text-left">
    <label className="block font-semibold text-left mb-1">
      {label}
    </label>

    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border rounded px-3 py-2 text-left"
    />
  </div>
);

