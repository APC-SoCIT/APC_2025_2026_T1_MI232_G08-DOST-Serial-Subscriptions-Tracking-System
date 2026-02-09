import React, { useState, useEffect } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import axios from 'axios';

export default function UserList() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [disableModal, setDisableModal] = useState({ open: false, user: null });
  const perPage = 10;

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users');
      if (response.data.success) {
        const users = response.data.users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'N/A',
          is_disabled: user.is_disabled || false,
          date: new Date(user.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: '2-digit', 
            year: 'numeric' 
          }),
        }));
        setAllUsers(users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDisable = async () => {
    if (!disableModal.user) return;
    
    try {
      const response = await axios.put(`/api/users/${disableModal.user.id}/toggle-disable`);
      if (response.data.success) {
        setAllUsers(prev => prev.map(u => 
          u.id === disableModal.user.id ? { ...u, is_disabled: response.data.is_disabled } : u
        ));
        setDisableModal({ open: false, user: null });
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status');
    }
  };

  const totalPages = Math.ceil(allUsers.length / perPage) || 1;
  const paginated = allUsers.slice((currentPage - 1) * perPage, currentPage * perPage);

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-600',
      tpu: 'bg-blue-100 text-blue-600',
      gsps: 'bg-orange-100 text-orange-600',
      supplier: 'bg-green-100 text-green-600',
      inspection: 'bg-yellow-100 text-yellow-600',
    };
    return colors[role?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  return (
    <AdminLayout header="Serial Subscription Tracking System">
      <div className="w-full">

        <p className="text-gray-500 mb-6">
          Review and manage user accounts.
        </p>

        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200 w-full">
  
          {/* Filters and Count */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
            <button
              onClick={fetchUsers}
              className="border rounded-lg px-4 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              Refresh
            </button>

            <span className="text-sm text-gray-600">
              {loading ? 'Loading...' : `Showing ${paginated.length} of ${allUsers.length}`}
            </span>
          </div>

          {/* Scrollable Table */}
          <div className="overflow-y-auto max-h-[480px]">
            {/* Header */}
            <div className="grid grid-cols-[2fr,2fr,1fr,1fr,1fr] gap-x-6 bg-gray-50 px-8 py-4 
                            text-xs font-semibold text-gray-600 tracking-wide">
              <span>NAME</span>
              <span>EMAIL</span>
              <span>ROLE</span>
              <span>DATE CREATED</span>
              <span>ACTIONS</span>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12 text-gray-500">
                Loading user accounts...
              </div>
            )}

            {/* Empty State */}
            {!loading && paginated.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No user accounts found.
              </div>
            )}

            {/* Rows */}
            {!loading && paginated.map((item, i) => (
              <div key={item.id}
                  className={`grid grid-cols-[2fr,2fr,1fr,1fr,1fr] gap-x-6 px-8 py-4 text-sm items-center 
                              ${item.is_disabled ? 'bg-gray-100 opacity-60' : (i % 2 === 0 ? "bg-gray-50/60" : "bg-white")}`}>
                  
                <span className={`font-medium ${item.is_disabled ? 'text-gray-400' : 'text-gray-800'}`}>
                  {item.name}
                  {item.is_disabled && <span className="ml-2 text-xs text-red-500">(Disabled)</span>}
                </span>
                <span className={`truncate ${item.is_disabled ? 'text-gray-400' : 'text-gray-700'}`} title={item.email}>{item.email}</span>

                <span>
                  <span className={`${getRoleBadgeColor(item.role)} px-3 py-1 rounded-full text-xs font-medium capitalize`}>
                    {item.role}
                  </span>
                </span>

                <span className={`${item.is_disabled ? 'text-gray-400' : 'text-gray-700'}`}>{item.date}</span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setDisableModal({ open: true, user: item })}
                    className={`px-3 py-1 text-xs rounded-lg ${item.is_disabled 
                      ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                      : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'}`}
                  >
                    {item.is_disabled ? 'Enable' : 'Disable'}
                  </button>
                </div>
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

        {/* Disable/Enable Confirmation Modal */}
        {disableModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {disableModal.user?.is_disabled ? 'Enable Account' : 'Disable Account'}
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to {disableModal.user?.is_disabled ? 'enable' : 'disable'} the account for <strong>{disableModal.user?.name}</strong>?
                {!disableModal.user?.is_disabled && ' This user will not be able to log in until re-enabled.'}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDisableModal({ open: false, user: null })}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleDisable}
                  className={`px-4 py-2 text-white rounded-lg ${disableModal.user?.is_disabled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-yellow-600 hover:bg-yellow-700'}`}
                >
                  {disableModal.user?.is_disabled ? 'Enable' : 'Disable'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
