import React, { useState } from "react";
import { useRef, useEffect } from "react";
import TPULayout from "@/Layouts/TPULayout";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList, // ✅ ADD THIS LINE (DO NOT REMOVE OTHERS)
} from "recharts";



/* ===============================
   YEAR OPTIONS (LIKE ADMIN)
================================ */
const YEARS = [2022, 2023, 2024, 2025];

/* ===============================
   KPI DATA (ANNUAL TOTALS)
================================ */
const yearlyKPI = {
  2022: { encoded: 120, delivered: 85, pending: 20, overdue: 15, inspected: 80 },
  2023: { encoded: 180, delivered: 140, pending: 25, overdue: 15, inspected: 135 },
  2024: { encoded: 240, delivered: 190, pending: 30, overdue: 20, inspected: 185 },
  2025: { encoded: 320, delivered: 260, pending: 35, overdue: 25, inspected: 250 },
};

/* ===============================
   MONTHLY MOCK DATA (ALL CHARTS)
================================ */
const monthlyData = {
  2025: [
    { month: "Jan", draft: 8, awarded: 20, delivery: 18, delivered: 15, inspected: 12, returned: 2 },
    { month: "Feb", draft: 7, awarded: 22, delivery: 20, delivered: 17, inspected: 14, returned: 2 },
    { month: "Mar", draft: 9, awarded: 25, delivery: 22, delivered: 18, inspected: 16, returned: 3 },
    { month: "Apr", draft: 10, awarded: 26, delivery: 23, delivered: 20, inspected: 18, returned: 3 },
    { month: "May", draft: 12, awarded: 28, delivery: 25, delivered: 22, inspected: 20, returned: 4 },
    { month: "Jun", draft: 10, awarded: 27, delivery: 24, delivered: 21, inspected: 19, returned: 4 },
    { month: "Jul", draft: 11, awarded: 29, delivery: 26, delivered: 23, inspected: 21, returned: 4 },
    { month: "Aug", draft: 12, awarded: 30, delivery: 28, delivered: 25, inspected: 22, returned: 5 },
    { month: "Sep", draft: 14, awarded: 32, delivery: 30, delivered: 27, inspected: 24, returned: 5 },
    { month: "Oct", draft: 15, awarded: 34, delivery: 32, delivered: 29, inspected: 26, returned: 6 },
    { month: "Nov", draft: 13, awarded: 33, delivery: 31, delivered: 28, inspected: 25, returned: 6 },
    { month: "Dec", draft: 14, awarded: 35, delivery: 33, delivered: 30, inspected: 27, returned: 6 },
  ],
};

monthlyData[2024] = monthlyData[2025].map(m => ({ ...m, delivered: m.delivered - 4 }));
monthlyData[2023] = monthlyData[2025].map(m => ({ ...m, delivered: m.delivered - 8 }));
monthlyData[2022] = monthlyData[2025].map(m => ({ ...m, delivered: m.delivered - 12 }));

/* ===============================
   ADMIN DASHBOARD COLORS
================================ */
const COLORS = {
  blue: "#2563eb",
  green: "#22c55e",
  yellow: "#facc15",
  red: "#ef4444",
  purple: "#a855f7",
  teal: "#14b8a6",
};

/* ===============================
   COMPONENT
================================ */
export default function Dashboard_TPU() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const renderPercentageLabel = ({value, percent }) =>
  `${name} ${value} (${(percent * 100).toFixed(0)}%)`;
  const pipelineData = monthlyData[selectedYear] || [];
  const renderInsideLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  value,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={14}
      fontWeight="bold"
    >
      {`${value} (${Math.round(percent * 100)}%)`}
    </text>
  );
};





  const kpi = yearlyKPI[selectedYear];
  const deliveryRate = Math.round((kpi.delivered / kpi.encoded) * 100);

  return (
    <TPULayout>
      <div className="space-y-6">

        {/* HEADER */}
       {/* HEADER + STORY + YEAR FILTER */}
<div className="flex justify-between items-start gap-6">
  
  {/* LEFT: TITLE + STORY TEXT */}
  <div>
    <p className="text-lg font-semibold text-gray-700 leading-relaxed max-w-4xl">
  This dashboard provides a consolidated overview of serial subscriptions handled by the TPU for the selected year. 
  It highlights total workload, delivery progress, inspection outcomes, and supplier reliability to help 
  identify bottlenecks and support operational decision-making.
</p>

  </div>

  <div className="flex flex-col items-end">
  <label className="text-lg font-bold text-gray-700 mb-2">
  Select Year
</label>



  <select
    value={selectedYear}
    onChange={(e) => setSelectedYear(Number(e.target.value))}
    className="
      border 
      rounded-lg 
      px-6 
      py-3 
      text-lg 
      font-semibold
      shadow-sm
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500
      w-36
    "
  >
    {YEARS.map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </select>
</div>


</div>


        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <KPI title="Total Serials Encoded" value={kpi.encoded} color={COLORS.blue} />
          <KPI title="Delivered to GSPS" value={kpi.delivered} color={COLORS.green} />
          <KPI title="Awaiting Delivery" value={kpi.pending} color={COLORS.yellow} />
          <KPI title="Overdue / Returned" value={kpi.overdue} color={COLORS.red} />
          <KPI title="Inspected" value={kpi.inspected} color={COLORS.purple} />
          <KPI title="Delivery Success Rate" value={`${deliveryRate}%`} color={COLORS.teal} />
        </div>

        {/* CHART 1: SERIAL PIPELINE (STACKED BAR) */}
      {/* ===============================
   CHARTS – 2 x 2 GRID (ADMIN STYLE)
================================ */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

  {/* CHART 1: SERIAL PIPELINE – STACKED AREA */}
<Card title="Serial Pipeline Status">
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={pipelineData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />

      <Area
        type="monotone"
        dataKey="draft"
        stackId="1"
        stroke="#94a3b8"
        fill="#cbd5e1"
        name="Draft"
      />

      <Area
        type="monotone"
        dataKey="awarded"
        stackId="1"
        stroke="#2563eb"
        fill="#3b82f6"
        name="Awarded"
      />

      <Area
        type="monotone"
        dataKey="delivery"
        stackId="1"
        stroke="#facc15"
        fill="#fde047"
        name="For Delivery"
      />

      <Area
        type="monotone"
        dataKey="delivered"
        stackId="1"
        stroke="#22c55e"
        fill="#4ade80"
        name="Delivered"
      />

      <Area
        type="monotone"
        dataKey="inspected"
        stackId="1"
        stroke="#a855f7"
        fill="#c084fc"
        name="Inspected"
      />

      <Area
        type="monotone"
        dataKey="returned"
        stackId="1"
        stroke="#ef4444"
        fill="#f87171"
        name="Returned"
      />
    </AreaChart>
  </ResponsiveContainer>
</Card>


  {/* CHART 2: DELIVERY PERFORMANCE TREND */}
  <Card title="Delivery Performance Trend">
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={monthlyData[selectedYear]}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="delivered"
          stroke={COLORS.green}
          strokeWidth={3}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </Card>

{/* CHART 3: SUPPLIER RELIABILITY */}
<Card title="Supplier Reliability Ranking">
  <ResponsiveContainer width="100%" height={300}>
    <BarChart
      data={[
        { name: "ABC Books", rate: 95 },
        { name: "Med Pub Ltd", rate: 88 },
        { name: "Global Periodicals", rate: 72 },
        { name: "Nat Geo", rate: 65 },
      ]}
      layout="vertical"
      margin={{ left: 40, right: 40 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" tickFormatter={(v) => `${v}%`} />
      <YAxis type="category" dataKey="name" />
      <Tooltip formatter={(value) => `${value}%`} />

      <Bar dataKey="rate" fill={COLORS.blue}>
        <LabelList
          dataKey="rate"
          position="right"
          formatter={(value) => `${value}%`}
          style={{ fontWeight: "bold", fill: "#111827" }}
        />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</Card>

  {/* CHART 4: INSPECTION OUTCOMES */}
<Card title="Inspection Outcomes">
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={[
          { name: "Inspected", value: kpi.inspected },
          { name: "Returned", value: kpi.overdue },
        ]}
        dataKey="value"
        cx="50%"
        cy="50%"
        innerRadius={40}
        outerRadius={120}
        label={renderInsideLabel}
        labelLine={false}
      >
        <Cell fill={COLORS.green} />
        <Cell fill={COLORS.red} />
      </Pie>

      <Tooltip formatter={(value) => `${value} items`} />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
</Card>



</div>


      </div>
    </TPULayout>
  );
}

/* ===============================
   SMALL COMPONENTS
================================ */
function KPI({ title, value, color }) {
  return (
    <div
      className="bg-white rounded-xl shadow-md p-5 border-l-4"
      style={{ borderColor: color }}
    >
      {/* KPI TITLE */}
      <p className="text-base font-semibold text-gray-600 tracking-wide">
        {title}
      </p>

      {/* KPI VALUE */}
      <p
        className="text-3xl font-extrabold mt-1"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}


function Card({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}
