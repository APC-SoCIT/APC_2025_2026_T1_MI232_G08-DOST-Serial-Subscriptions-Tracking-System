import React, { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import axios from 'axios';
import { FaDownload, FaSearch, FaFilter, FaSync } from 'react-icons/fa';
import { HiX } from 'react-icons/hi';

/* ================= CONSTANTS ================= */
const ACTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
];

const ROLES = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'tpu', label: 'TPU' },
  { value: 'gsps', label: 'GSPS' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'inspection', label: 'Inspection' },
];

const MODULES = [
  { value: 'all', label: 'All Modules' },
  { value: 'User', label: 'Users/Accounts' },
  { value: 'SupplierAccount', label: 'Supplier Accounts' },
  { value: 'Subscription', label: 'Subscriptions/Serials' },
  { value: 'Message', label: 'Messages/Chat' },
  { value: 'Profile', label: 'Profile' },
];

/* ================= HELPERS ================= */
const getActionBadgeColor = (action) => {
  const colors = {
    login: 'bg-green-100 text-green-700',
    logout: 'bg-gray-100 text-gray-700',
    create: 'bg-blue-100 text-blue-700',
    update: 'bg-yellow-100 text-yellow-700',
    delete: 'bg-red-100 text-red-700',
    approve: 'bg-emerald-100 text-emerald-700',
    reject: 'bg-rose-100 text-rose-700',
  };
  return colors[action?.toLowerCase()] || 'bg-gray-100 text-gray-600';
};

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

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getModuleName = (modelType) => {
  if (!modelType) return 'System';
  // Extract the model name from the full class path
  const parts = modelType.split('\\');
  const modelName = parts[parts.length - 1];
  
  const moduleMap = {
    User: 'Accounts',
    SupplierAccount: 'Supplier Accounts',
    Subscription: 'Subscriptions',
    Message: 'Messages',
    Chat: 'Chat',
    DeliveryNotification: 'Notifications',
    ProcessMovementLog: 'Process Movement',
  };
  return moduleMap[modelName] || modelName;
};

/* ================= COMPONENT ================= */
export default function AdminLogs() {
  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    this_week: 0,
    by_action: {},
  });

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 15;

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  // Download state
  const [downloading, setDownloading] = useState(false);

  /* ================= DATA FETCHING ================= */
  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 500, // Get more logs for client-side filtering
      };
      
      if (actionFilter !== 'all') params.action = actionFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (search) params.search = search;

      const response = await axios.get('/api/logs/audit', { params });
      if (response.data.success) {
        setLogs(response.data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/logs/audit/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  /* ================= FILTERING (CLIENT-SIDE) ================= */
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter(log => 
        log.role?.toLowerCase() === roleFilter.toLowerCase()
      );
    }

    // Filter by module
    if (moduleFilter !== 'all') {
      result = result.filter(log => 
        log.model_type?.includes(moduleFilter)
      );
    }

    // Filter by search (user name, email, description)
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(log =>
        log.user_name?.toLowerCase().includes(searchLower) ||
        log.user_email?.toLowerCase().includes(searchLower) ||
        log.description?.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [logs, roleFilter, moduleFilter, search]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / perPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter, roleFilter, moduleFilter, startDate, endDate]);

  /* ================= HANDLERS ================= */
  const handleApplyFilters = () => {
    fetchLogs();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSearch('');
    setActionFilter('all');
    setRoleFilter('all');
    setModuleFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    fetchLogs();
  };

  const handleDownload = async (format = 'csv') => {
    setDownloading(true);
    try {
      const params = {
        format,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        module: moduleFilter !== 'all' ? moduleFilter : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: search || undefined,
      };

      const response = await axios.get('/api/logs/audit/download', {
        params,
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading logs:', error);
      alert('Failed to download logs. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AdminLayout title="Activity Logs">
      <Head title="Activity Logs" />

      <div className="space-y-6">
        {/* Header & Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Total Logs</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-2xl font-bold text-gray-800">{stats.today}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500">This Week</p>
            <p className="text-2xl font-bold text-gray-800">{stats.this_week}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">Logins Today</p>
            <p className="text-2xl font-bold text-gray-800">{stats.by_action?.login || 0}</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
          
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 border-b border-gray-100 gap-4">
            
            {/* Search */}
            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, action, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                <FaFilter size={14} />
                Filters
                {(actionFilter !== 'all' || roleFilter !== 'all' || moduleFilter !== 'all' || startDate || endDate) && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Active</span>
                )}
              </button>

              <button
                onClick={() => { fetchLogs(); fetchStats(); }}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                <FaSync size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>

              {/* Download Dropdown */}
              <div className="relative group">
                <button
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  <FaDownload size={14} />
                  {downloading ? 'Downloading...' : 'Download'}
                </button>
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                  <button
                    onClick={() => handleDownload('csv')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={() => handleDownload('json')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg"
                  >
                    Download JSON
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Action Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Action Type</label>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ACTIONS.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                {/* Role Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">User Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Module Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Module</label>
                  <select
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MODULES.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 tracking-wide">USER</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 tracking-wide">ROLE</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 tracking-wide">ACTION</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 tracking-wide">MODULE</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 tracking-wide">DESCRIPTION</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 tracking-wide">TIMESTAMP</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 tracking-wide">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <FaSync className="animate-spin" />
                        Loading activity logs...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No activity logs found.
                    </td>
                  </tr>
                )}

                {!loading && paginatedLogs.map((log, index) => (
                  <tr 
                    key={log._id || log.id || index} 
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{log.user_name || 'System'}</p>
                        <p className="text-xs text-gray-500">{log.user_email || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`${getRoleBadgeColor(log.role)} px-2 py-1 rounded-full text-xs font-medium capitalize`}>
                        {log.role || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`${getActionBadgeColor(log.action)} px-2 py-1 rounded-full text-xs font-medium capitalize`}>
                        {log.action || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getModuleName(log.model_type)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 max-w-xs truncate" title={log.description}>
                        {log.description || 'No description'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Showing {paginatedLogs.length} of {filteredLogs.length} logs
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <span className="text-sm px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <HiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">User Name</p>
                  <p className="text-sm text-gray-800">{selectedLog.user_name || 'System'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">User Email</p>
                  <p className="text-sm text-gray-800">{selectedLog.user_email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Role</p>
                  <span className={`${getRoleBadgeColor(selectedLog.role)} px-2 py-1 rounded-full text-xs font-medium capitalize`}>
                    {selectedLog.role || 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Action</p>
                  <span className={`${getActionBadgeColor(selectedLog.action)} px-2 py-1 rounded-full text-xs font-medium capitalize`}>
                    {selectedLog.action || 'N/A'}
                  </span>
                </div>
              </div>

              <hr />

              {/* Activity Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Module Affected</p>
                  <p className="text-sm text-gray-800">{getModuleName(selectedLog.model_type)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Record ID</p>
                  <p className="text-sm text-gray-800 font-mono">{selectedLog.model_id || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Description</p>
                <p className="text-sm text-gray-800">{selectedLog.description || 'No description provided'}</p>
              </div>

              <hr />

              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">IP Address</p>
                  <p className="text-sm text-gray-800 font-mono">{selectedLog.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">HTTP Method</p>
                  <p className="text-sm text-gray-800">{selectedLog.method || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">URL</p>
                  <p className="text-sm text-gray-800 break-all">{selectedLog.url || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">User Agent</p>
                  <p className="text-sm text-gray-800 break-all">{selectedLog.user_agent || 'N/A'}</p>
                </div>
              </div>

              <hr />

              {/* Timestamp */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Timestamp</p>
                <p className="text-sm text-gray-800">{formatDateTime(selectedLog.created_at)}</p>
              </div>

              {/* Old/New Values (for updates) */}
              {(selectedLog.old_values || selectedLog.new_values) && (
                <>
                  <hr />
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLog.old_values && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Previous Values</p>
                        <pre className="text-xs bg-red-50 p-3 rounded-lg overflow-auto max-h-40">
                          {JSON.stringify(selectedLog.old_values, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.new_values && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">New Values</p>
                        <pre className="text-xs bg-green-50 p-3 rounded-lg overflow-auto max-h-40">
                          {JSON.stringify(selectedLog.new_values, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
