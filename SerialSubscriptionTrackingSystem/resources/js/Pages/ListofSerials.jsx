import InspectionLayout from "@/Layouts/InspectionLayout";
import { useState } from "react";

export default function ListOfSerials() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const perPage = 4; // number of rows per page

  const serials = [
    { issueNo: "0094-2375", title: "Advanced Programming Concepts Journal", cost: 3600, date: "2025-12-10", status: "Approved" },
    { issueNo: "0094-2376", title: "Business Analytics Review", cost: 4200, date: "2025-11-15", status: "Pending" },
    { issueNo: "0094-2377", title: "Digital Marketing Insights", cost: 3000, date: "2025-10-10", status: "Rejected" },
    { issueNo: "0094-2378", title: "Harvard Business Review", cost: 5000, date: "2025-12-01", status: "Approved" },
    { issueNo: "0094-2380", title: "AI Research Journal", cost: 4000, date: "2025-12-20", status: "Approved" },
    { issueNo: "0094-2381", title: "Cybersecurity Insights", cost: 3800, date: "2025-12-20", status: "Pending" },
    { issueNo: "0094-2382", title: "Data Science Monthly", cost: 3500, date: "2025-12-21", status: "Approved" },
    { issueNo: "0094-2383", title: "Machine Learning Digest", cost: 3000, date: "2025-12-19", status: "Rejected" },
  ];

  // Filter serials based on date, month, and year
  const filteredSerials = serials.filter((item) => {
    const [year, month, day] = item.date.split("-");
    
    if (filterDate && item.date !== filterDate) return false;
    if (filterMonth && month !== filterMonth) return false;
    if (filterYear && year !== filterYear) return false;
    
    return true;
  });

  const totalPages = Math.ceil(filteredSerials.length / perPage);
  const paginatedData = filteredSerials.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <InspectionLayout header="List of Serials">
      <h2 className="text-2xl font-bold text-[#004A98] mb-2">List of Serials</h2>
      <p className="text-sm text-gray-500 mb-6">
        Complete list of all serials in the system.
      </p>

      <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
        {/* Date Filters */}
        <div className="mb-6 pb-6 border-b border-gray-300">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Filter by Date</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Specific Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Month</label>
              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Year</label>
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                <option value="2020">2020</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>
          {(filterDate || filterMonth || filterYear) && (
            <button
              onClick={() => {
                setFilterDate("");
                setFilterMonth("");
                setFilterYear("");
                setCurrentPage(1);
              }}
              className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        <table className="w-full border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left font-semibold text-sm w-40">ISSUE NO.</th>
              <th className="p-2 text-left font-semibold text-sm flex-1">SERIAL TITLE</th>
              <th className="p-2 text-left font-semibold text-sm w-40">COST</th>
              <th className="p-2 text-left font-semibold text-sm w-40">DATE</th>
              <th className="p-2 text-left font-semibold text-sm w-40">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <tr key={item.issueNo} className="border-t hover:bg-gray-50">
                  <td className="p-2 align-middle text-sm w-40">{item.issueNo}</td>
                  <td className="p-2 align-middle text-sm flex-1">{item.title}</td>
                  <td className="p-2 align-middle text-sm w-40">₱{item.cost.toLocaleString()}</td>
                  <td className="p-2 align-middle text-sm w-40">{item.date}</td>
                  <td className="p-2 align-middle text-sm w-40">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        item.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : item.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.status === "Approved" ? "Accepted" : item.status === "Rejected" ? "For Return" : item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">
                  No serials found for the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="flex justify-end mt-4 gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">{currentPage} / {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </InspectionLayout>
  );
}
