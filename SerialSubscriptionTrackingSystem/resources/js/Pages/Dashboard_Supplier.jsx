import React, { useState, useMemo, useEffect } from "react";
import SupplierLayout from "@/Layouts/SupplierLayout";
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
  `${year}-${String(monthIndex(month) + 1).padStart(2, "0")}-01`;

const lastDayOfMonth = (year, month) =>
  new Date(year, monthIndex(month) + 1, 0).toISOString().split("T")[0];

const yearWeight = (year) =>
  ({ 2022: 0.9, 2023: 0.95, 2024: 1.0, 2025: 1.1 }[year] || 1);

// 🔑 CRITICAL FOR DATE REACTIVITY
const dateSpanFactor = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) return 0.1;

  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  return Math.min(diffDays / 365, 1);
};

/* ================= PIE LABEL ================= */

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + r * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + r * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="#fff" fontSize={14} fontWeight="700" textAnchor="middle">
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

/* ================= COMPONENT ================= */

export default function SupplierDashboard() {

  /* ================= FILTER STATE ================= */

  const [year, setYear] = useState(2025);
  const [startMonth, setStartMonth] = useState("January");
  const [endMonth, setEndMonth] = useState("December");
  const [startDate, setStartDate] = useState(firstDayOfMonth(2025, "January"));
  const [endDate, setEndDate] = useState(lastDayOfMonth(2025, "December"));

  useEffect(() => setStartDate(firstDayOfMonth(year, startMonth)), [year, startMonth]);
  useEffect(() => setEndDate(lastDayOfMonth(year, endMonth)), [year, endMonth]);

  const months = monthRange(startMonth, endMonth);
  const yFactor = yearWeight(year);
  const dFactor = dateSpanFactor(startDate, endDate);

  /* ================= KPIs ================= */

  const awarded = Math.round(180 * yFactor * dFactor);
  const delivered = Math.round(140 * yFactor * dFactor);
  const returned = Math.round(12 * yFactor * dFactor);
  
  

  const kpis = {
    awarded,
    preparing: Math.round(60 * yFactor * dFactor),
    forDelivery: Math.round(45 * yFactor * dFactor),
    delivered,
    returned,
    success: Math.round((delivered / Math.max(awarded, 1)) * 100),
  };

  /* ================= CHART DATA ================= */

  const pipelineData = months.map((m, i) => ({
    month: m,
    awarded: Math.round((20 + i * 2) * yFactor * dFactor),
    preparing: Math.round((12 + i) * yFactor * dFactor),
    forDelivery: Math.round((10 + i) * yFactor * dFactor),
    delivered: Math.round((18 + i * 1.5) * yFactor * dFactor),
    returned: Math.round((2 + i * 0.3) * yFactor * dFactor),
  }));

  const deliveryTrend = months.map((m, i) => ({
    month: m,
    delivered: Math.round((10 + i * 2) * yFactor * dFactor),
  }));

  const monthlyVolume = months.map((m, i) => ({
    month: m,
    volume: Math.round((15 + i * 1.8) * yFactor * dFactor),
  }));

  const inspectionPie = useMemo(() => {
    const baseReturnRate = {
      2022: 0.10,
      2023: 0.09,
      2024: 0.08,
      2025: 0.07,
    }[year] || 0.08;

    const total = Math.round(200 * yFactor * dFactor);
    const rejected = Math.round(total * baseReturnRate);
    const passed = total - rejected;

    return [
      { name: "Delivered (Passed)", value: passed },
      { name: "Returned", value: rejected },
    ];
  }, [year, dFactor]);

  /* ================= RENDER ================= */

  return (
    <SupplierLayout>
      <Head title="Supplier Dashboard" />

      <div className="space-y-6">

        {/* ================= FILTERS ================= */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Dashboard Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <SmallSelect label="Year" value={year} onChange={setYear} options={YEARS} />
            <SmallSelect label="Start Month" value={startMonth} onChange={setStartMonth} options={MONTHS} />
            <SmallSelect label="End Month" value={endMonth} onChange={setEndMonth} options={MONTHS} />
            <SmallInput label="Start Date" value={startDate} onChange={setStartDate} />
            <SmallInput label="End Date" value={endDate} onChange={setEndDate} />
          </div>
        </div>

        {/* ================= KPIs ================= */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <KPI title="Awarded Serials" value={kpis.awarded} />
          <KPI title="Preparing Delivery" value={kpis.preparing} color="text-yellow-500" />
          <KPI title="For Delivery" value={kpis.forDelivery} color="text-green-600" />
          <KPI title="Delivered to GSPS" value={kpis.delivered} color="text-emerald-600" />
          <KPI title="Returned" value={kpis.returned} color="text-red-500" />
          <KPI title="Success Rate" value={`${kpis.success}%`} color="text-teal-600" />
        </div>

        {/* ================= CHARTS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Chart title="Delivery Pipeline Status">
  <ResponsiveContainer width="100%" height={340}>
    <AreaChart
      data={pipelineData}
      margin={{ top: 20, right: 20, left: 0, bottom: 70 }} // 👈 spacing fix
    >
      <XAxis
        dataKey="month"
        interval="preserveStartEnd"
        tick={{ fontSize: 12 }}
        angle={-25}          // 👈 prevents overlap on zoom
        textAnchor="end"
        height={60}
      />

      <YAxis tick={{ fontSize: 12 }} />

      <Tooltip />

      {/* 👇 Legend FIXED */}
      <Legend
        verticalAlign="bottom"
        align="center"
        wrapperStyle={{
          paddingTop: 20,
          fontSize: 13,
        }}
      />

      {/* 👇 IMPORTANT: stroke MUST match fill */}
      <Area
        dataKey="awarded"
        stackId="1"
        name="Awarded"
        fill={COLORS.awarded}
        stroke={COLORS.awarded}
      />

      <Area
        dataKey="preparing"
        stackId="1"
        name="Preparing"
        fill={COLORS.preparing}
        stroke={COLORS.preparing}
      />

      <Area
        dataKey="forDelivery"
        stackId="1"
        name="For Delivery"
        fill={COLORS.forDelivery}
        stroke={COLORS.forDelivery}
      />

      <Area
        dataKey="delivered"
        stackId="1"
        name="Delivered"
        fill={COLORS.delivered}
        stroke={COLORS.delivered}
      />

      <Area
        dataKey="returned"
        stackId="1"
        name="Returned"
        fill={COLORS.returned}
        stroke={COLORS.returned}
      />
    </AreaChart>
  </ResponsiveContainer>
</Chart>


          <Chart title="Delivered Serials Trend">
            <ResponsiveContainer height={300}>
              <LineChart data={deliveryTrend}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="delivered" stroke={COLORS.awarded} strokeWidth={4} />
              </LineChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Monthly Delivery Volume">
            <ResponsiveContainer height={300}>
              <BarChart data={monthlyVolume}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="volume" fill={COLORS.forDelivery} />
              </BarChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Inspection Outcome">
            <ResponsiveContainer height={300}>
              <PieChart>
                   <Pie
                  data={inspectionPie}
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={100}
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {inspectionPie.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#22c55e" : "#ef4444"}
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Chart>

        </div>
      </div>
    </SupplierLayout>
  );
}

/* ================= UI COMPONENTS ================= */

const KPI = ({ title, value, color = "text-blue-600" }) => (
  <div className="bg-white p-5 rounded-xl shadow">
    <p className="text-sm font-semibold text-gray-600">{title}</p>
    <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
  </div>
);

const Chart = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <h3 className="text-lg font-bold mb-4">{title}</h3>
    {children}
  </div>
);

const SmallSelect = ({ label, value, onChange, options }) => (
  <div>
    <label className="text-lg font-bold">{label}</label>
    <Listbox value={value} onChange={onChange}>
      <Listbox.Button className="w-full border rounded px-3 py-2 font-semibold">
        {value}
      </Listbox.Button>
      <Listbox.Options className="absolute bg-white border rounded shadow z-10 w-48">
        {options.map(o => (
          <Listbox.Option key={o} value={o} className="px-3 py-2 hover:bg-blue-100 cursor-pointer">
            {o}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  </div>
);

const SmallInput = ({ label, value, onChange }) => (
  <div>
    <label className="text-lg font-bold">{label}</label>
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border rounded px-3 py-2 font-semibold"
    />
  </div>
);
