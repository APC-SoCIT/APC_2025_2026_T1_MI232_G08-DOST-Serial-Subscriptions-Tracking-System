import InspectionLayout from "@/Layouts/InspectionLayout";
import { useState } from "react";

export default function ListOfSerials() {
  const [currentPage, setCurrentPage] = useState(1);
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

  const totalPages = Math.ceil(serials.length / perPage);
  const paginatedData = serials.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <InspectionLayout header="List of Serials">
      <p className="text-sm text-gray-500 mb-6">
        Complete list of all serials in the system.
      </p>

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
                  No serials found
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
