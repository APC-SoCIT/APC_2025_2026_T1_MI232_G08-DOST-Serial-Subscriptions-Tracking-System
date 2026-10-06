import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MdRefresh, MdSearch, MdClose } from 'react-icons/md';
import { useRole } from '@/Components/RequireRole';
import TPULayout from '@/Layouts/TpuLayout';
import AdminLayout from '@/Layouts/AdminLayout';

const statusLabel = (status) => ({ delivered: 'Delivered', for_return: 'For Return' }[status] || String(status || '-').replace(/(^|_)([a-z])/g, (_, prefix, letter) => `${prefix ? ' ' : ''}${letter.toUpperCase()}`));

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const formatAwardCost = (value) => `P${parseFloat(value || 0).toLocaleString()}`;

function ArchiveContent() {
  const { isTpu } = useRole();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRecords, setSelectedRecords] = useState({});
  const [viewDetailsGroup, setViewDetailsGroup] = useState(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/archive', { params: { search } });
      setRecords(response.data.records || []);
      setSelectedRecords({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, [search]);

  const groups = records.reduce((result, record) => {
    const key = `${record.subscription_id}-${record.title}`;
    if (!result[key]) {
      result[key] = {
        key,
        title: record.title,
        issn: record.issn,
        supplier_name: record.supplier_name,
        award_cost: record.award_cost,
        period: record.period,
        author_publisher: record.author_publisher,
        language: record.language,
        frequency: record.frequency,
        category: record.category,
        records: [],
      };
    }
    result[key].records.push(record);
    return result;
  }, {});
  const groupList = Object.values(groups);

  // Keep the modal's own data pointer in sync whenever the underlying
  // records refresh (e.g. right after a restore), so it doesn't show stale
  // issues or close unexpectedly mid-review.
  useEffect(() => {
    if (!viewDetailsGroup) return;
    const refreshed = groupList.find((group) => group.key === viewDetailsGroup.key);
    if (refreshed) {
      setViewDetailsGroup(refreshed);
    } else {
      setViewDetailsGroup(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  const restore = async (record) => {
    await axios.delete(`/api/archive/${record.subscription_id}/${record.issue_number}`);
    await loadRecords();
  };

  const toggleSelection = (record) => {
    const key = `${record.subscription_id}-${record.issue_number}`;
    setSelectedRecords((current) => ({ ...current, [key]: current[key] ? undefined : record }));
  };

  const selectedCount = Object.values(selectedRecords).filter(Boolean).length;

  const bulkRestore = async () => {
    const selected = Object.values(selectedRecords).filter(Boolean);
    if (!selected.length) return;
    await axios.post('/api/archive/bulk-restore', {
      records: selected.map((record) => ({ subscription_id: record.subscription_id, issue_number: record.issue_number })),
    });
    await loadRecords();
  };

  const handleViewDetails = (group) => setViewDetailsGroup(group);
  const handleCloseViewDetailsModal = () => setViewDetailsGroup(null);

  return (
    <div style={{ padding: 24 }}>
      {/* Main Content Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ color: '#004A98', margin: 0, fontSize: 20 }}>Archive</h2>
            <p style={{ color: '#667085', margin: '4px 0 0 0', fontSize: 14 }}>Archived delivery records are retained for review and audit.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {isTpu && selectedCount > 0 && (
              <button
                type="button"
                onClick={bulkRestore}
                style={{
                  background: '#0f9d58',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Restore selected ({selectedCount})
              </button>
            )}
            <button
              onClick={loadRecords}
              disabled={loading}
              style={{
                background: '#004A98',
                border: 'none',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <MdRefresh size={18} /> {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input
            type="text"
            placeholder="Search title, ISSN, supplier, issue"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              borderRadius: 6,
              border: '1px solid #ddd',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Archive Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #004A98, #0062f4)', color: '#fff' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Serial Title</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Supplier Name</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Delivery Date</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Award Cost</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                    Loading archived records...
                  </td>
                </tr>
              )}
              {!loading && groupList.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                    No archived records found.
                  </td>
                </tr>
              )}
              {!loading && groupList.map((group, index) => (
                <tr key={group.key} style={{ borderBottom: '1px solid #eee', background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>{group.title}</td>
                  <td style={{ padding: '16px' }}>{group.supplier_name || '-'}</td>
                  <td style={{ padding: '16px', color: '#666' }}>{formatDisplayDate(group.period)}</td>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: '#004A98' }}>{formatAwardCost(group.award_cost)}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: 20,
                      background: '#e2e3e5',
                      color: '#383d41',
                      fontSize: 12,
                      fontWeight: 500,
                    }}>
                      Archived
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      onClick={() => handleViewDetails(group)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #004A98',
                        color: '#004A98',
                        padding: '8px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#004A98';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#004A98';
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {viewDetailsGroup && (
        <div
          onClick={handleCloseViewDetailsModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 30,
              maxWidth: 900,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h2 style={{ margin: 0, color: '#004A98', fontSize: 22, fontWeight: 600 }}>{viewDetailsGroup.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ padding: '6px 16px', borderRadius: 20, background: '#e2e3e5', color: '#383d41', fontSize: 13, fontWeight: 500 }}>
                  Archived
                </span>
                <button
                  onClick={handleCloseViewDetailsModal}
                  style={{ background: 'none', border: 'none', fontSize: 24, color: '#666', cursor: 'pointer', padding: 4 }}
                >
                  <MdClose />
                </button>
              </div>
            </div>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: 14 }}>Archived Serial Details</p>

            {/* Serial Information Section */}
            <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 24, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 16, color: '#004A98' }}>Serial Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                <div>
                  <span style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' }}>ISSN</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: 15, fontWeight: 600, color: '#333' }}>{viewDetailsGroup.issn || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Supplier</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: 15, fontWeight: 500, color: '#333' }}>{viewDetailsGroup.supplier_name || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Publisher</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: 15, fontWeight: 500, color: '#333' }}>{viewDetailsGroup.author_publisher || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Language</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: 15, fontWeight: 600, color: '#333' }}>{viewDetailsGroup.language || 'English'}</p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Frequency</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: 15, fontWeight: 600, color: '#333' }}>{viewDetailsGroup.frequency || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Category</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: 15, fontWeight: 600, color: '#333' }}>{viewDetailsGroup.category || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Delivery Date</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: 15, fontWeight: 600, color: '#333' }}>{formatDisplayDate(viewDetailsGroup.period)}</p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Award Cost</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: 15, fontWeight: 700, color: '#004A98' }}>{formatAwardCost(viewDetailsGroup.award_cost)}</p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' }}>Archived Issues</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: 15, fontWeight: 600, color: '#333' }}>
                    {viewDetailsGroup.records.length} {viewDetailsGroup.records.length === 1 ? 'issue' : 'issues'}
                  </p>
                </div>
              </div>
            </div>

            {/* Archived Issues Section */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#004A98' }}>Archived Issues</h3>
              <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                  <thead>
                    <tr>
                      {['Issue #', 'Status', 'Completed Date', 'Archived Date', ...(isTpu ? ['Action'] : [])].map((heading) => (
                        <th key={heading} style={{ textAlign: heading === 'Action' ? 'center' : 'left', padding: 10, borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#666' }}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetailsGroup.records.map((record) => (
                      <tr key={`${record.subscription_id}-${record.issue_number}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: 10 }}>Issue #{record.issue_number}</td>
                        <td style={{ padding: 10 }}>{statusLabel(record.status || record.inspection_status)}</td>
                        <td style={{ padding: 10 }}>{record.completion_date ? new Date(record.completion_date).toLocaleDateString() : '-'}</td>
                        <td style={{ padding: 10 }}>{record.archived_at ? new Date(record.archived_at).toLocaleDateString() : '-'}</td>
                        {isTpu && (
                          <td style={{ padding: 10, textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={() => restore(record)}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid #0f9d58',
                                  color: '#0f9d58',
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  fontWeight: 500,
                                }}
                              >
                                Restore
                              </button>
                              <input
                                type="checkbox"
                                checked={!!selectedRecords[`${record.subscription_id}-${record.issue_number}`]}
                                onChange={() => toggleSelection(record)}
                                aria-label={`Select Issue ${record.issue_number} for restore`}
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 20, borderTop: '1px solid #eee' }}>
              <div>
                {isTpu && selectedCount > 0 && (
                  <button
                    onClick={bulkRestore}
                    style={{
                      padding: '10px 20px',
                      background: '#0f9d58',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    Restore selected ({selectedCount})
                  </button>
                )}
              </div>
              <button
                onClick={handleCloseViewDetailsModal}
                style={{
                  padding: '10px 24px',
                  background: '#004A98',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Archive() {
  const { isTpu } = useRole();
  return isTpu ? <TPULayout title="Archive"><ArchiveContent /></TPULayout> : <AdminLayout title="Archive"><ArchiveContent /></AdminLayout>;
}