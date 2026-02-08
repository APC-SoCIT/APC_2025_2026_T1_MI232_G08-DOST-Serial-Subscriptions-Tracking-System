import React, { useState, useEffect } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import axios from 'axios';

export default function UserList() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [editModal, setEditModal] = useState({ open: false, user: null, newRole: '' });
  const perPage = 10;

  const roleOptions = ['tpu', 'gsps', 'supplier', 'inspection'];

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
          status: user.email_verified_at ? 'Verified' : 'Unverified',
          date: new Date(user.created_at).toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: '2-digit' 
          }).replace(/\//g, '.'),
        }));
        setAllUsers(users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.user) return;
    
    try {
      const response = await axios.delete(`/api/users/${deleteModal.user.id}`);
      if (response.data.success) {
        setAllUsers(prev => prev.filter(u => u.id !== deleteModal.user.id));
        setDeleteModal({ open: false, user: null });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleUpdateRole = async () => {
    if (!editModal.user || !editModal.newRole) return;
    
    try {
      const response = await axios.put(`/api/users/${editModal.user.id}/role`, {
        role: editModal.newRole
      });
      if (response.data.success) {
        setAllUsers(prev => prev.map(u => 
          u.id === editModal.user.id ? { ...u, role: editModal.newRole } : u
        ));
        setEditModal({ open: false, user: null, newRole: '' });
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
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
            <div className="grid grid-cols-[2fr,2fr,1fr,1fr,1fr,1fr] gap-x-6 bg-gray-50 px-8 py-4 
                            text-xs font-semibold text-gray-600 tracking-wide">
              <span>NAME</span>
              <span>EMAIL</span>
              <span>ROLE</span>
              <span>STATUS</span>
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
                  className={`grid grid-cols-[2fr,2fr,1fr,1fr,1fr,1fr] gap-x-6 px-8 py-4 text-sm items-center 
                              ${i % 2 === 0 ? "bg-gray-50/60" : "bg-white"}`}>
                  
                <span className="font-medium text-gray-800">{item.name}</span>
                <span className="text-gray-700 truncate" title={item.email}>{item.email}</span>

                <span>
                  <span className={`${getRoleBadgeColor(item.role)} px-3 py-1 rounded-full text-xs font-medium capitalize`}>
                    {item.role}
                  </span>
                </span>

                <span>
                  <span className={`${item.status === 'Verified' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'} px-3 py-1 rounded-full text-xs font-medium`}>
                    {item.status}
                  </span>
                </span>

                <span className="text-gray-700">{item.date}</span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditModal({ open: true, user: item, newRole: item.role })}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteModal({ open: true, user: item })}
                    className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    Delete
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

        {/* Delete Confirmation Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete user <strong>{deleteModal.user?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal({ open: false, user: null })}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Role Modal */}
        {editModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit User Role</h3>
              <p className="text-gray-600 mb-4">
                Update role for <strong>{editModal.user?.name}</strong>
              </p>
              <select
                value={editModal.newRole}
                onChange={(e) => setEditModal(prev => ({ ...prev, newRole: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roleOptions.map(role => (
                  <option key={role} value={role}>{role.toUpperCase()}</option>
                ))}
              </select>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditModal({ open: false, user: null, newRole: '' })}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRole}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
