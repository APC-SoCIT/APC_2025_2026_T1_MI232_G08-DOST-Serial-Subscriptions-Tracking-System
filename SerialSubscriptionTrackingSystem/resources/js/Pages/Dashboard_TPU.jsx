import React, { useState, useMemo, useEffect } from "react";
import TPULayout from "@/Layouts/TPULayout";
import { Head } from "@inertiajs/react";
import { Listbox } from "@headlessui/react";
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar, LabelList,   // 👈 ADD THIS
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
  delivered: "#22c55e",
  forDelivery: "#fde047",
  inspected: "#a855f7",
  returned: "#ef4444"
};

/* ================= HELPERS ================= */
const dateSpanFactor = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) return 0.1;

  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  return Math.min(diffDays / 365, 1); // normalize to year
};


const monthIndex = (m) => MONTHS.indexOf(m);

const monthRange = (start, end) =>
  MONTHS.slice(monthIndex(start), monthIndex(end) + 1);

const firstDayOfMonth = (year, month) =>
  `${year}-${String(monthIndex(month) + 1).padStart(2, "0")}-01`;

const lastDayOfMonth = (year, month) =>
  new Date(year, monthIndex(month) + 1, 0).toISOString().split("T")[0];

const yearWeight = (year) =>
  ({ 2022: 0.85, 2023: 0.95, 2024: 1.0, 2025: 1.1 }[year] || 1);

/* ================= PIE LABEL ================= */

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      fontSize={14}
      fontWeight="700"
      textAnchor="middle"
      dominantBaseline="central"
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

/* ================= COMPONENT ================= */

export default function TPUDashboard() {
  
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
  const dFactor = dateSpanFactor(startDate, endDate);


  /* ================= KPI DATA ================= */

const total = Math.round(320 * yFactor * dFactor);
const delivered = Math.round(260 * yFactor * dFactor);

const kpis = {
  total,
  delivered,
  awaiting: Math.round(35 * yFactor * dFactor),
  returned: Math.round(25 * yFactor * dFactor),
  inspected: Math.round(250 * yFactor * dFactor),
  success: Math.round((delivered / Math.max(total, 1)) * 100),
};

  /* ================= CHART DATA ================= */

  const pipelineData = months.map((m, i) => ({
  month: m,
  awarded: Math.round((30 + i * 2) * yFactor * dFactor),
  delivered: Math.round((25 + i * 2) * yFactor * dFactor),
  forDelivery: Math.round((15 + i) * yFactor * dFactor),
  inspected: Math.round((10 + i) * yFactor * dFactor),
  returned: Math.round((5 + i * 0.5) * yFactor * dFactor),
}));


 const deliveryTrend = months.map((m, i) => ({
  month: m,
  delivered: Math.round(
    (15 + i * 1.5 + (i % 2 ? -1 : 1)) * yFactor * dFactor
  ),
}));


const supplierRanking = useMemo(() => {
  const scale = months.length / 12;
  const weight = yearWeight(year);

  const cap = (v) => Math.min(100, Math.round(v));

  return [
    { name: "ABC Books", value: cap(95 * scale * weight) },
    { name: "Med Pub Ltd", value: cap(88 * scale * weight) },
    { name: "Global Periodicals", value: cap(72 * scale * weight) },
    { name: "Nat Geo", value: cap(65 * scale * weight) },
  ];
}, [year, months]);




 const inspectionPie = useMemo(() => {
  const scale = months.length / 12;
  const weight = yearWeight(year) * dFactor;

  const baseReturnRate = {
    2022: 0.12,
    2023: 0.10,
    2024: 0.09,
    2025: 0.07,
  }[year] || 0.1;

  const totalInspections = Math.round(275 * scale * weight);
  const returned = Math.round(totalInspections * baseReturnRate);
  const inspected = Math.max(totalInspections - returned, 0);

  return [
    { name: "Inspected", value: inspected },
    { name: "Returned", value: returned },
  ];
}, [year, months, dFactor]);




  /* ================= RENDER ================= */

  return (
    <TPULayout>
      

      <div className="space-y-6">

        {/* FILTERS */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Dashboard Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <SmallSelect label="Year" value={year} onChange={setYear} options={YEARS} />
            <SmallSelect label="Start Month" value={startMonth} onChange={setStartMonth} options={MONTHS} />
            <SmallSelect label="End Month" value={endMonth} onChange={setEndMonth} options={MONTHS} />
            <SmallInput label="Start Date" value={startDate} onChange={setStartDate} />
            <SmallInput label="End Date" value={endDate} onChange={setEndDate} />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <KPI title="Total Serials Encoded" value={kpis.total} />
          <KPI title="Delivered to GSPS" value={kpis.delivered} color="text-green-600" />
          <KPI title="Awaiting Delivery" value={kpis.awaiting} color="text-yellow-500" />
          <KPI title="Overdue / Returned" value={kpis.returned} color="text-red-500" />
          <KPI title="Inspected" value={kpis.inspected} color="text-purple-500" />
          <KPI title="Delivery Success Rate" value={`${kpis.success}%`} color="text-teal-600" />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* SERIAL PIPELINE */}
          <Chart title="Serial Pipeline Status">
            <ResponsiveContainer height={300}>
             <AreaChart data={pipelineData}>
  <XAxis dataKey="month" tick={{ fontSize: 14, fontWeight: 600 }} />
  tickFormatter={(m) => m.slice(0, 3)} // Jan, Feb, Mar

  <YAxis tick={{ fontSize: 14, fontWeight: 600 }} />
  <Tooltip />
  <Legend
  verticalAlign="bottom"
  align="center"
  wrapperStyle={{ paddingTop: 10 }}
/>

  <Area
    dataKey="awarded"
    name="Awarded"
    stackId="1"
    fill={COLORS.awarded}
    stroke={COLORS.awarded}
  />

  <Area
    dataKey="delivered"
    name="Delivered"
    stackId="1"
    fill={COLORS.delivered}
    stroke={COLORS.delivered}
  />

  <Area
    dataKey="forDelivery"
    name="For Delivery"
    stackId="1"
    fill={COLORS.forDelivery}
    stroke={COLORS.forDelivery}
  />

  <Area
    dataKey="inspected"
    name="Inspected"
    stackId="1"
    fill={COLORS.inspected}
    stroke={COLORS.inspected}
  />

  <Area
    dataKey="returned"
    name="Returned"
    stackId="1"
    fill={COLORS.returned}
    stroke={COLORS.returned}
  />
</AreaChart>

            </ResponsiveContainer>
          </Chart>

          {/* DELIVERY TREND */}
          <Chart title="Delivery Performance Trend">
            <ResponsiveContainer height={300}>
              <LineChart data={deliveryTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 14, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 14, fontWeight: 600 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="delivered" stroke="#0e06eaff" strokeWidth={4} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Chart>

          {/* SUPPLIER RANKING */}
<Chart title="Supplier Reliability Ranking">
  <ResponsiveContainer height={300}>
    <BarChart data={supplierRanking} layout="vertical">
      <XAxis
        type="number"
        domain={[0, 100]}
        tickFormatter={(value) => value + "%"}
      />

      <YAxis
        type="category"
        dataKey="name"
        tick={{ fontSize: 14, fontWeight: 600 }}
      />

      <Tooltip formatter={(value) => value + "%"} />

      <Bar dataKey="value" fill="#2563eb">
        <LabelList
          dataKey="value"
          position="right"
          formatter={(value) => value + "%"}
        />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</Chart>



          {/* INSPECTION PIE */}
        <Chart title="Inspection Outcomes">
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
    </TPULayout>
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
