import InspectionLayout from "@/Layouts/InspectionLayout";
import {
  FaBoxOpen,
  FaChartLine,
  FaTruck,
  FaClipboardCheck,
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
  const [showModal, setShowModal] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState(null);
  const [condition, setCondition] = useState("Good");
  const [inspectorName, setInspectorName] = useState("");
  const [remark, setRemark] = useState("");
  const [otherDescription, setOtherDescription] = useState("");
  const [checklist, setChecklist] = useState({
    missingPages: false,
    tornPages: false,
    waterDamage: false,
    misprint: false,
    other: false,
  });

  const [serialsForInspection, setSerialsForInspection] = useState([
    {
      id: 1,
      issueNo: "MB-2025-001",
      title: "Manila Bulletin – January Edition",
      supplier: "Manila Bulletin",
      deliveryDate: "2025-12-18",
      status: "Pending",
    },
    {
      id: 2,
      issueNo: "HBR-2025-014",
      title: "Harvard Business Review – December",
      supplier: "Harvard Business Review",
      deliveryDate: "2025-12-22",
      status: "Pending",
    },
  ]);

  const lastUpdated = new Date().toLocaleString();

  const checklistLabels = {
    missingPages: "Missing Pages",
    tornPages: "Torn Pages",
    waterDamage: "Water Damage",
    misprint: "Misprint",
    other: "Others",
  };

  // ===================== FUNCTIONS =====================
  const openModal = (serial) => {
    setSelectedSerial(serial);
    setInspectorName("");
    setRemark("");
    setOtherDescription("");
    setChecklist({
      missingPages: false,
      tornPages: false,
      waterDamage: false,
      misprint: false,
      other: false,
    });
    setCondition("Good");
    setShowModal(true);
  };

  const submitInspection = () => {
    if (!inspectorName.trim()) {
      alert("Inspector name is required.");
      return;
    }

    const newStatus = condition === "Damaged" ? "Rejected" : "Inspected";

    setSerialsForInspection((prev) =>
      prev.map((s) =>
        s.id === selectedSerial.id ? { ...s, status: newStatus } : s
      )
    );

    alert(`Inspection submitted by ${inspectorName}`);
    setShowModal(false);
  };

  // ===================== UI =====================
  return (
    <InspectionLayout header="Dashboard Overview">
      <div className="max-w-[1600px] mx-auto px-4">

        {/* DASHBOARD OVERVIEW & GREETING */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#004A98] mb-2">Dashboard Overview</h2>
          <p className="text-sm text-gray-600">Good Evening, Welcome back!</p>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {[ 
            { title: "Total Serials", value: "568", icon: <FaBoxOpen /> },
            { title: "Best Supplier", value: "Manila Bulletin", icon: <FaChartLine /> },
            { title: "Most Delivered", value: "Harvard Business Review", icon: <FaTruck /> },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">{item.title}</p>
                <h3 className="text-lg font-semibold">{item.value}</h3>
              </div>
              <div className="text-blue-600 text-3xl">{item.icon}</div>
            </div>
          ))}
        </div>

        {/* LINE CHART */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <h4 className="text-lg font-semibold text-[#004A98]">
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

          <div className="h-[320px]">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[ 
            { title: "Serials by Category", data: serialCategoryData, width: 140 },
            { title: "Top Suppliers", data: topSuppliers, width: 180 },
          ].map((chart, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow">
              <h4 className="text-lg font-semibold text-[#004A98] mb-4">
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

        {/* INSPECTION TABLE */}
        <div className="bg-white p-6 rounded-2xl shadow mb-4">
          <h4 className="flex items-center gap-2 text-lg font-semibold text-[#004A98] mb-4">
            <FaClipboardCheck /> Serials for Inspection
          </h4>

          <table className="w-full border rounded">
            <thead className="bg-gray-100">
              <tr>
                {["Issue", "Title", "Supplier", "Date Received", "Status", "Action"].map((h) => (
                  <th key={h} className="p-2 text-left font-semibold text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serialsForInspection.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 align-middle text-sm">{s.issueNo}</td>
                  <td className="p-2 align-middle text-sm">{s.title}</td>
                  <td className="p-2 align-middle text-sm">{s.supplier}</td>
                  <td className="p-2 align-middle text-sm">{s.deliveryDate}</td>
                  <td className="p-2 align-middle text-sm">{s.status}</td>
                  <td className="p-2 align-middle">
                    {s.status === "Pending" && (
                      <button
                        onClick={() => openModal(s)}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                      >
                        Inspect
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4">
                Inspection – {selectedSerial.issueNo}
              </h3>

              <input
                placeholder="Inspector Name"
                className="w-full border p-2 rounded mb-4"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
              />

              <select
                className="w-full border p-2 rounded mb-4"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option>Acceptable</option>
                <option>Damaged</option>
              </select>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {Object.keys(checklist).map((key) => (
                  <label key={key} className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checklist[key]}
                      onChange={(e) =>
                        setChecklist({ ...checklist, [key]: e.target.checked })
                      }
                    />
                    {checklistLabels[key]}
                  </label>
                ))}
              </div>

              {checklist.other && (
                <input
                  type="text"
                  placeholder="Please specify"
                  className="w-full border p-2 rounded mb-4 text-sm"
                  value={otherDescription}
                  onChange={(e) => setOtherDescription(e.target.value)}
                />
              )}

              <textarea
                placeholder="Remarks"
                className="w-full border p-2 rounded mb-4 text-sm"
                rows="4"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={submitInspection}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  For Return
                </button>
                <button
                  onClick={submitInspection}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Mark as Inspected
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InspectionLayout>
  );
}
