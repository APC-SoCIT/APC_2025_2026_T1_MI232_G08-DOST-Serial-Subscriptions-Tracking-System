import InspectionLayout from "@/Layouts/InspectionLayout";
import { useState } from "react";

export default function ViewByDate() {
  const [filter, setFilter] = useState("This Year");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 3; // number of rows per page

  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];

  const serials = [
    { issueNo: "0094-2380", title: "AI Research Journal", cost: 4000, date: formattedToday, status: "Approved" },
    { issueNo: "0094-2381", title: "Cybersecurity Insights", cost: 3800, date: formattedToday, status: "Pending" },
    { issueNo: "0094-2382", title: "Data Science Monthly", cost: 3500, date: "2025-12-21", status: "Approved" },
    { issueNo: "0094-2383", title: "Machine Learning Digest", cost: 3000, date: "2025-12-19", status: "Rejected" },
    { issueNo: "0094-2375", title: "Advanced Programming Concepts Journal", cost: 3600, date: "2025-12-10", status: "Approved" },
    { issueNo: "0094-2376", title: "Business Analytics Review", cost: 4200, date: "2025-11-15", status: "Pending" },
    { issueNo: "0094-2377", title: "Digital Marketing Insights", cost: 3000, date: "2025-10-10", status: "Rejected" },
  ];

  const filteredSerials = serials.filter((item) => {
    const serialDate = new Date(item.date);
    switch (filter) {
      case "Today":
        return serialDate.toDateString() === today.toDateString();
      case "This Week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return serialDate >= startOfWeek && serialDate <= endOfWeek;
      case "This Month":
        return serialDate.getMonth() === today.getMonth() && serialDate.getFullYear() === today.getFullYear();
      case "This Year":
        return serialDate.getFullYear() === today.getFullYear();
      default:
        return true;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredSerials.length / perPage);
  const paginatedData = filteredSerials.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <InspectionLayout header="View by Date">
      <p className="text-sm text-gray-500 mb-6">
        List of serials filtered by date range.
      </p>

      <div className="flex gap-4 mb-6">
        {["Today", "This Week", "This Month", "This Year"].map((dateFilter) => (
          <button
            key={dateFilter}
            onClick={() => { setFilter(dateFilter); setCurrentPage(1); }}
            className={`px-4 py-2 rounded font-medium ${
              filter === dateFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {dateFilter}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
        <table className="min-w-full text-base border-collapse">
          <thead>
            <tr className="text-gray-500 border-b border-gray-300">
              <th className="text-left px-6 py-4">ISSUE NO.</th>
              <th className="text-left px-6 py-4">SERIAL TITLE</th>
              <th className="text-left px-6 py-4">COST</th>
              <th className="text-left px-6 py-4">DATE</th>
              <th className="text-left px-6 py-4">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <tr key={item.issueNo} className="border-b border-gray-200 last:border-0">
                  <td className="px-6 py-6 font-medium">{item.issueNo}</td>
                  <td className="px-6 py-6">{item.title}</td>
                  <td className="px-6 py-6">₱{item.cost.toLocaleString()}</td>
                  <td className="px-6 py-6">{item.date}</td>
                  <td className="px-6 py-6">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        item.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : item.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">
                  No serials found for this date range
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
