import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MdRefresh } from 'react-icons/md';
import { useRole } from '@/Components/RequireRole';
import TPULayout from '@/Layouts/TpuLayout';
import AdminLayout from '@/Layouts/AdminLayout';

const statusLabel = (status) => ({ delivered: 'Delivered', for_return: 'For Return' }[status] || String(status || '-').replace(/(^|_)([a-z])/g, (_, prefix, letter) => `${prefix ? ' ' : ''}${letter.toUpperCase()}`));

function ArchiveContent() {
  const { isTpu } = useRole();
  const [records, setRecords] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedRecords, setSelectedRecords] = useState({});

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/archive', { params: { search, status } });
      const nextRecords = response.data.records || [];
      setRecords(nextRecords);
      setExpanded({});
      setSelectedRecords({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, [search, status]);

  const groups = records.reduce((result, record) => {
    const key = `${record.subscription_id}-${record.title}`;
    if (!result[key]) result[key] = { key, title: record.title, issn: record.issn, supplier_name: record.supplier_name, records: [] };
    result[key].records.push(record);
    return result;
  }, {});

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

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: '#004A98', fontSize: 20, fontWeight: 600 }}>Archive</h2>
          <p style={{ color: '#667085' }}>Archived delivery records are retained for review and audit.</p>
        </div>
        {/* FIX: Restore Selected now lives in the same flex row as the rest of the
            controls, positioned immediately before Refresh, instead of its own
            separate block that broke the layout. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, ISSN, supplier, issue" />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="delivered">Delivered</option>
            <option value="for_return">For Return</option>
          </select>
          {isTpu && selectedCount > 0 && (
            <button
              type="button"
              onClick={bulkRestore}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f9d58', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 14px', fontWeight: 500, whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              Restore selected ({selectedCount})
            </button>
          )}
          <button
            type="button"
            onClick={loadRecords}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', border: 'none', borderRadius: 6, background: '#004A98', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, opacity: loading ? 0.7 : 1 }}
          >
            <MdRefresh size={18} /> {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      {loading ? <p>Loading archived records...</p> : (
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #dbe3ec' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead><tr>
              <th style={{ width: '34%', textAlign: 'left', padding: 12, borderBottom: '1px solid #dbe3ec' }}>Serial Title</th>
              <th style={{ width: '20%', textAlign: 'left', padding: 12, borderBottom: '1px solid #dbe3ec' }}>ISSN</th>
              <th style={{ width: '28%', textAlign: 'left', padding: 12, borderBottom: '1px solid #dbe3ec' }}>Supplier</th>
              <th style={{ width: '18%', textAlign: 'left', padding: 12, borderBottom: '1px solid #dbe3ec' }}>Archived Issues</th>
            </tr></thead>
            <tbody>
              {Object.values(groups).map((group) => {
                const isExpanded = !!expanded[group.key];
                return <React.Fragment key={group.key}>
                  <tr onClick={() => setExpanded((current) => ({ ...current, [group.key]: !isExpanded }))} style={{ cursor: 'pointer', borderBottom: isExpanded ? 'none' : '1px solid #dbe3ec', background: '#f8fbff' }}>
                    <td style={{ padding: 14, fontWeight: 600, color: '#004A98' }}>{isExpanded ? '▾' : '▸'} {group.title}</td>
                    <td style={{ padding: 14 }}>{group.issn || '-'}</td>
                    <td style={{ padding: 14 }}>{group.supplier_name || '-'}</td>
                    <td style={{ padding: 14 }}>{group.records.length} archived {group.records.length === 1 ? 'issue' : 'issues'}</td>
                  </tr>
                  {isExpanded && <tr><td colSpan="4" style={{ padding: 0 }}><div style={{ padding: '0 16px 12px', background: '#f8fbff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                      <thead><tr>{['Issue #', 'Status', 'Completed date', 'Archived date', ...(isTpu ? ['Action'] : [])].map((heading) => <th key={heading} style={{ textAlign: heading === 'Action' ? 'center' : 'left', padding: 10, borderBottom: '1px solid #e5e7eb', fontSize: 12 }}>{heading}</th>)}</tr></thead>
                      <tbody>{group.records.map((record) => <tr key={`${record.subscription_id}-${record.issue_number}`}>
                        <td style={{ padding: 10 }}>Issue #{record.issue_number}</td>
                        <td style={{ padding: 10 }}>{statusLabel(record.status || record.inspection_status)}</td>
                        <td style={{ padding: 10 }}>{record.completion_date ? new Date(record.completion_date).toLocaleDateString() : '-'}</td>
                        <td style={{ padding: 10 }}>{record.archived_at ? new Date(record.archived_at).toLocaleDateString() : '-'}</td>
                        {isTpu && <td style={{ padding: 10, textAlign: 'center' }}><div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><button onClick={() => restore(record)}>Restore</button><input type="checkbox" checked={!!selectedRecords[`${record.subscription_id}-${record.issue_number}`]} onChange={() => toggleSelection(record)} aria-label={`Select Issue ${record.issue_number} for restore`} /></div></td>}
                      </tr>)}</tbody>
                    </table>
                  </div></td></tr>}
                </React.Fragment>;
              })}
              {!records.length && <tr><td colSpan="4" style={{ padding: 32, textAlign: 'center' }}>No archived records found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Archive() {
  const { isTpu } = useRole();
  return isTpu ? <TPULayout title="Archive"><ArchiveContent /></TPULayout> : <AdminLayout title="Archive"><ArchiveContent /></AdminLayout>;
}