import React, { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";

export default function SupplierList() {
  const allSuppliers = [
    { name: "Continental Learning Editions Inc.", status: "Active", date: "01.23.11", type: "Publisher" },
    { name: "Bulletin of the World Health Organization", status: "Active", date: "09.15.12", type: "Organization" },
    { name: "Bulletin of the American Mathematical Society", status: "Active", date: "10.29.13", type: "Organization" },
    { name: "Journal of the London Mathematical Society", status: "Active", date: "12.02.14", type: "Journal" },
    { name: "New Century Knowledge House", status: "Active", date: "02.14.15", type: "Publisher" },
    { name: "Clarity Bulletin and Books Inc.", status: "Active", date: "05.19.16", type: "Publisher" },
    { name: "NextGen Learning Digest Co.", status: "Active", date: "01.08.16", type: "Publisher" },
    { name: "Pacific Coast Journal Syndicate", status: "Active", date: "03.26.17", type: "Journal" },
    { name: "OpenPage Academic Press", status: "Active", date: "08.17.18", type: "Publisher" },
    { name: "Frontline Manual Publishing Group", status: "Active", date: "09.14.18", type: "Publisher" },
    { name: "Allied Journal Press Network", status: "Active", date: "07.30.19", type: "Publisher" },
    { name: "NextRead Educational Materials", status: "Active", date: "09.24.20", type: "Publisher" },
    { name: "Metro Scientific Bulletin Corp.", status: "Active", date: "11.22.21", type: "Publisher" },
  ];

  const [filterType, setFilterType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const filtered =
    filterType === "All"
      ? allSuppliers
      : allSuppliers.filter((s) => s.type === filterType);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <AdminLayout header="Serial Subscription Tracking System">
      <div className="w-full">

        <p className="text-gray-500 mb-6">
          Review and manage suppliers accounts.
        </p>

        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200 w-full">
  
        {/* Filters and Count */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
            <select
            className="border rounded-lg px-7 py-2 text-sm bg-white"
            value={filterType}
            onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
            }}
            >
            <option value="All">All Roles</option>
            <option value="Publisher">Publisher</option>
            <option value="Organization">Organization</option>
            <option value="Journal">Journal</option>
            </select>

            <span className="text-sm text-gray-600">
            Showing {paginated.length} of {filtered.length}
            </span>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-y-auto max-h-[480px]">
            {/* Header */}
            <div className="grid grid-cols-[2.5fr,1fr,1fr,1fr] gap-x-10 bg-gray-50 px-8 py-4 
                            text-xs font-semibold text-gray-600 tracking-wide">
            <span>SUPPLIER NAME</span>
            <span>STATUS</span>
            <span>DATE</span>
            <span>TYPE</span>
            </div>

            {/* Rows */}
            {paginated.map((item, i) => (
            <div key={i}
                className={`grid grid-cols-[2.5fr,1fr,1fr,1fr] gap-x-10 px-10 py-4 text-sm items-center 
                            ${i % 2 === 0 ? "bg-gray-50/60" : "bg-white"}`}>
                
                <span className="font-medium text-gray-800">{item.name}</span>

                <span>
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium">
                    {item.status}
                </span>
                </span>

                <span className="text-gray-700">{item.date}</span>
                <span className="font-medium text-gray-700">{item.type}</span>
            </div>
            ))}
        </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-40"
            disabled={currentPage === 1}
          >
            Prev
          </button>

          <span className="text-sm px-2">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-40"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
