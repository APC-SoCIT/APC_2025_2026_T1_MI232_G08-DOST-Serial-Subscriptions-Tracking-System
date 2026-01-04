import React, { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";

export default function AccountApproval() {
  const allAccounts = [
    { name: "VoguePh", email: "subscription@vogue.ph", contact: "091347038912", date: "06.20.2025", role: "Supplier" },
    { name: "Billboard PH", email: "web@modernmediagroupinc.com", contact: "09038094335", date: "06.13.2025", role: "Supplier" },
    { name: "Infobyte Public", email: "infobytepublications@gmail.com", contact: "(032) 260-7143", date: "06.12.2025", role: "Supplier" },
    { name: "FullStack Reads Co.", email: "info@fullstackreads.com", contact: "(02) 8374-9215", date: "06.12.2025", role: "Supplier" },
    { name: "The Secured Page", email: "editorial@thesecuredpage.com", contact: "+63 917 845 2301", date: "06.11.2025", role: "Supplier" },
    { name: "Isabella Cruz", email: "isabellacruz@gmail.com", contact: "0917 8245632", date: "06.11.2025", role: "TPU" },
    { name: "Ava Thompson", email: "avathompson@gmail.com", contact: "09264138970", date: "06.11.2025", role: "GSPS" },
    { name: "Maria Santos", email: "mariasantos@gmail.com", contact: "09456783201", date: "06.11.2025", role: "Inspection Team" },
    { name: "Liam Reyes", email: "liamreyes@gmail.com", contact: "09271502498", date: "06.10.2025", role: "GSPS" },
    { name: "Kenji Tanaka", email: "kenjitanaka@gmail.com", contact: "09193764820", date: "06.10.2025", role: "Inspection Team" },
    { name: "Miguel Herrera", email: "miguelherrera@gmail.com", contact: "09365421173", date: "06.10.2025", role: "TPU" },
  ];

  const [roleFilter, setRoleFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const filtered = roleFilter === "All"
    ? allAccounts
    : allAccounts.filter(a => a.role === roleFilter);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <AdminLayout header="Serial Subscription Tracking System">
      <div className="w-full">

        {/* Subtitle */}
        <p className="text-gray-500 mb-6">Review and manage pending account applications.</p>

        {/* Table Container */}
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200 w-full">

          {/* Filters inside white box */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <select
              className="border rounded-lg px-7 py-2 text-sm bg-white"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">All Roles</option>
              <option value="Supplier">Supplier</option>
              <option value="TPU">TPU</option>
              <option value="GSPS">GSPS</option>
              <option value="Inspection Team">Inspection Team</option>
            </select>

            <span className="text-sm text-gray-600">
              Showing {paginated.length} of {filtered.length}
            </span>
          </div>

          {/* Scrollable Table */}
          <div className="overflow-y-auto max-h-[480px]">

            {/* Header */}
            <div className="grid grid-cols-[1.4fr,2.6fr,1.2fr,1fr,1.4fr,1.7fr] gap-x-8 bg-gray-50 px-6 py-4 
                            text-xs font-semibold text-gray-600 tracking-wide">
              <span>NAME</span>
              <span>EMAIL</span>
              <span>CONTACT NO.</span>
              <span>DATE</span>
              <span>ROLE</span>
              <span>ACTION</span>
            </div>

            {/* Rows */}
            {paginated.map((item, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1.4fr,2.6fr,1.2fr,1fr,1.4fr,1.7fr] gap-x-8 px-6 py-4 
                          text-sm items-center ${i % 2 === 0 ? "bg-gray-50/60" : "bg-white"}`}
              >
                <span className="font-medium">{item.name}</span>

                <span className="text-gray-700 truncate pr-6" title={item.email}>
                  {item.email}
                </span>

                <span>{item.contact}</span>
                <span>{item.date}</span>

                <span className="font-medium text-gray-700 whitespace-nowrap">
                  {item.role}
                </span>

                <div className="flex gap-3 justify-end">
                  <button className="bg-red-500 text-white px-4 py-1 rounded-full text-xs shadow-sm hover:bg-red-600">
                    Reject
                  </button>
                  <button className="bg-green-500 text-white px-4 py-1 rounded-full text-xs shadow-sm hover:bg-green-600">
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-40"
            disabled={currentPage === 1}
          >
            Prev
          </button>

          <span className="text-sm px-2">Page {currentPage} of {totalPages}</span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
