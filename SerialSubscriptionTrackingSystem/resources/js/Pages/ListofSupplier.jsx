import React, { useState, useEffect } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import axios from 'axios';

export default function SupplierList() {
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const perPage = 10;

  // Fetch approved supplier accounts on mount
  useEffect(() => {
    fetchApprovedSuppliers();
  }, []);

  const fetchApprovedSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/supplier-accounts/approved');
      if (response.data.success) {
        // Transform supplier accounts to match the display format
        const suppliers = response.data.accounts.map(acc => ({
          id: acc._id || acc.id,
          name: acc.company_name,
          contactPerson: acc.contact_person,
          email: acc.email,
          phone: acc.phone,
          is_disabled: acc.is_disabled || false,
          date: new Date(acc.approved_at || acc.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: '2-digit', 
            year: 'numeric' 
          }),
        }));
        setAllSuppliers(suppliers);
      }
    } catch (error) {
      console.error('Error fetching approved suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = allSuppliers.filter((supplier) => {
    const matchesSearch = [supplier.name, supplier.contactPerson, supplier.email]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? !supplier.is_disabled : supplier.is_disabled);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSuppliers.length / perPage) || 1;
  const paginated = filteredSuppliers.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <AdminLayout header="Serial Subscription Tracking System">
      <div className="w-full">

        <p className="text-gray-500 mb-6">
          Review and manage suppliers accounts.
        </p>

        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200 w-full">
  
        {/* Filters and Count */}
        <div className="flex flex-col gap-4 px-8 py-4 border-b border-gray-100 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search supplier, contact person, or email"
                className="border rounded-lg px-4 py-2 text-sm w-full sm:w-80"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-lg px-4 py-2 text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="border rounded-lg px-4 py-2 text-sm bg-gray-50 text-gray-700 hover:bg-gray-100"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchApprovedSuppliers}
                className="border rounded-lg px-4 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                Refresh
              </button>

              <span className="text-sm text-gray-600">
                {loading ? 'Loading...' : `Showing ${paginated.length} of ${filteredSuppliers.length}`}
              </span>
            </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-y-auto max-h-[480px]">
            {/* Header */}
            <div className="grid grid-cols-[2fr,1.5fr,2fr,1fr,1fr] gap-x-6 bg-gray-50 px-8 py-4 
                            text-xs font-semibold text-gray-600 tracking-wide">
            <span>SUPPLIER NAME</span>
            <span>CONTACT PERSON</span>
            <span>EMAIL</span>
            <span>STATUS</span>
            <span>DATE APPROVED</span>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12 text-gray-500">
                Loading supplier accounts...
              </div>
            )}

            {/* Empty State */}
            {!loading && paginated.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No approved supplier accounts found.
              </div>
            )}

            {/* Rows */}
            {!loading && paginated.map((item, i) => (
            <div key={item.id}
                className={`grid grid-cols-[2fr,1.5fr,2fr,1fr,1fr] gap-x-6 px-8 py-4 text-sm items-center 
                            ${item.is_disabled ? 'bg-gray-100 opacity-60' : (i % 2 === 0 ? "bg-gray-50/60" : "bg-white")}`}>
                
                <span className={`font-medium ${item.is_disabled ? 'text-gray-400' : 'text-gray-800'}`}>
                  {item.name}
                  {item.is_disabled && <span className="ml-2 text-xs text-red-500">(Disabled)</span>}
                </span>
                <span className={`${item.is_disabled ? 'text-gray-400' : 'text-gray-700'}`}>{item.contactPerson}</span>
                <span className={`truncate ${item.is_disabled ? 'text-gray-400' : 'text-gray-700'}`} title={item.email}>{item.email}</span>

                <span>
                <span className={`${item.is_disabled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} px-3 py-1 rounded-full text-xs font-medium`}>
                    {item.is_disabled ? 'Disabled' : 'Active'}
                </span>
                </span>

                <span className={`${item.is_disabled ? 'text-gray-400' : 'text-gray-700'}`}>{item.date}</span>
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
