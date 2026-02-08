import InspectionLayout from "@/Layouts/InspectionLayout";
import {
  FaBoxOpen,
  FaChartLine,
  FaTruck,
} from "react-icons/fa";
import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function InspectionDashboard() {
  // ===================== DATA =====================
  const timeData = {
    "1W": [
      { name: "Mon", value: 20 },
      { name: "Tue", value: 35 },
      { name: "Wed", value: 25 },
      { name: "Thu", value: 40 },
      { name: "Fri", value: 30 },
    ],
    "1M": [
      { name: "Week 1", value: 120 },
      { name: "Week 2", value: 150 },
      { name: "Week 3", value: 100 },
      { name: "Week 4", value: 180 },
    ],
    "3M": [
      { name: "Jan", value: 400 },
      { name: "Feb", value: 450 },
      { name: "Mar", value: 380 },
    ],
    "1Y": [
      { name: "Jan", value: 500 },
      { name: "Feb", value: 600 },
      { name: "Mar", value: 550 },
      { name: "Apr", value: 700 },
      { name: "May", value: 650 },
      { name: "Jun", value: 720 },
      { name: "Jul", value: 680 },
      { name: "Aug", value: 750 },
      { name: "Sep", value: 800 },
      { name: "Oct", value: 780 },
      { name: "Nov", value: 820 },
      { name: "Dec", value: 900 },
    ],
  };

  const serialCategoryData = [
    { name: "Programming", value: 46 },
    { name: "Business", value: 35 },
    { name: "Management", value: 27 },
    { name: "Technology", value: 18 },
    { name: "Finance", value: 17 },
    { name: "Marketing", value: 14 },
  ];

  const topSuppliers = [
    { name: "Manila Bulletin", value: 340 },
    { name: "Harvard Business Review", value: 280 },
    { name: "Business Mirror", value: 260 },
    { name: "Inquirer", value: 190 },
  ];

  // ===================== STATE =====================
  const [timeFilter, setTimeFilter] = useState("1Y");
  const [yearFilter, setYearFilter] = useState("2025");

  // ===================== UI =====================
  return (
    <InspectionLayout header="Dashboard Overview">
      <div className="max-w-[1600px] mx-auto px-4">

        

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[ 
            { title: "Total Serials", value: "568", icon: <FaBoxOpen /> },
            { title: "Best Supplier", value: "Manila Bulletin", icon: <FaChartLine /> },
            { title: "Most Delivered", value: "Harvard Business Review", icon: <FaTruck /> },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow flex justify-between items-center">
              <div>
                <p className="text-gray-500">{item.title}</p>
                <h3 className="text-xl font-semibold">{item.value}</h3>
              </div>
              <div className="text-blue-600 text-3xl">{item.icon}</div>
            </div>
          ))}
        </div>

        {/* LINE CHART */}
        <div className="bg-white rounded-2xl shadow p-8 mb-10">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
            <h4 className="text-xl font-semibold text-[#004A98]">
              Serials Over Time
            </h4>

            <div className="flex gap-2 items-center">
              {["Weekly", "Monthly", "Quarterly", "Yearly"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFilter(tf)}
                  className={`px-4 py-1.5 rounded-full text-sm ${
                    timeFilter === tf
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {tf}
                </button>
              ))}

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="border rounded-full px-3 py-1.5 text-sm"
              >
                <option>2025</option>
                <option>2024</option>
              </select>
            </div>
          </div>

          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData[timeFilter]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#004A98"
                  strokeWidth={4}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BAR CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {[ 
            { title: "Serials by Category", data: serialCategoryData, width: 140 },
            { title: "Top Suppliers", data: topSuppliers, width: 180 },
          ].map((chart, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow">
              <h4 className="text-xl font-semibold text-[#004A98] mb-6">
                {chart.title}
              </h4>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart
                  layout="vertical"
                  data={chart.data}
                  margin={{ left: 20, right: 30 }}
                  barCategoryGap={20}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={chart.width} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#004A98" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    </InspectionLayout>
  );
}
