import React, { useState, useEffect } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import axios from 'axios';

export default function AccountApproval() {
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Fetch pending accounts on mount
  useEffect(() => {
    fetchPendingAccounts();
  }, []);

  const fetchPendingAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/supplier-accounts/pending');
      if (response.data.success) {
        // Transform supplier accounts to match the display format
        const supplierAccounts = response.data.accounts.map(acc => ({
          id: acc._id || acc.id,
          name: acc.company_name,
          email: acc.email,
          contact: acc.phone,
          date: new Date(acc.created_at).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          role: 'Supplier',
          originalData: acc,
        }));
        setAllAccounts(supplierAccounts);
      }
    } catch (error) {
      console.error('Error fetching pending accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (account) => {
    if (processingId) return;
    
    setProcessingId(account.id);
    try {
      const response = await axios.post(`/api/supplier-accounts/${account.id}/approve`);
      if (response.data.success) {
        // Remove the approved account from the list
        setAllAccounts(prev => prev.filter(acc => acc.id !== account.id));
        alert(`${account.name} has been approved successfully!`);
      }
    } catch (error) {
      console.error('Error approving account:', error);
      alert('Failed to approve account. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (account) => {
    if (processingId) return;
    
    const reason = prompt('Enter rejection reason (optional):');
    
    setProcessingId(account.id);
    try {
      const response = await axios.post(`/api/supplier-accounts/${account.id}/reject`, {
        reason: reason || null,
      });
      if (response.data.success) {
        // Remove the rejected account from the list
        setAllAccounts(prev => prev.filter(acc => acc.id !== account.id));
        alert(`${account.name} has been rejected.`);
      }
    } catch (error) {
      console.error('Error rejecting account:', error);
      alert('Failed to reject account. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const totalPages = Math.ceil(allAccounts.length / perPage) || 1;
  const paginated = allAccounts.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <AdminLayout header="Serial Subscription Tracking System">
      <div className="w-full">

        {/* Subtitle */}
        <p className="text-gray-500 mb-6">Review and manage pending account applications.</p>

        {/* Table Container */}
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200 w-full">

          {/* Filters inside white box */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <span className="border rounded-lg px-7 py-2 text-sm bg-white font-medium">
                Supplier
              </span>

              <button
                onClick={fetchPendingAccounts}
                className="border rounded-lg px-4 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                Refresh
              </button>
            </div>

            <span className="text-sm text-gray-600">
              {loading ? 'Loading...' : `Showing ${paginated.length} of ${allAccounts.length}`}
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

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12 text-gray-500">
                Loading pending accounts...
              </div>
            )}

            {/* Empty State */}
            {!loading && paginated.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No pending accounts to review.
              </div>
            )}

            {/* Rows */}
            {!loading && paginated.map((item, i) => (
              <div
                key={item.id}
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
                  <button 
                    onClick={() => handleReject(item)}
                    disabled={processingId === item.id}
                    className={`bg-red-500 text-white px-4 py-1 rounded-full text-xs shadow-sm hover:bg-red-600 ${
                      processingId === item.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {processingId === item.id ? '...' : 'Reject'}
                  </button>
                  <button 
                    onClick={() => handleApprove(item)}
                    disabled={processingId === item.id}
                    className={`bg-green-500 text-white px-4 py-1 rounded-full text-xs shadow-sm hover:bg-green-600 ${
                      processingId === item.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {processingId === item.id ? '...' : 'Accept'}
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
