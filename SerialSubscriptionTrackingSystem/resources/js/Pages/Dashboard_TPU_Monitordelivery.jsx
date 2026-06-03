import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import TPULayout from '@/Layouts/TpuLayout';
import { MdSearch, MdFilterList, MdRefresh, MdVisibility, MdExpandMore, MdExpandLess } from "react-icons/md";
import { FiPackage, FiCheckCircle, FiClock, FiAlertTriangle } from "react-icons/fi";
import { FaHistory } from "react-icons/fa";

/**
 * TPU Monitor Delivery - Shows subscriptions with serial issues
 * Status is "Ongoing" until all issues are delivered
 */
function MonitorDelivery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // API data state
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({ total: 0, delivered: 0, ongoing: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Expanded row state
  const [expandedRow, setExpandedRow] = useState(null);
  
  // View modal
  const [viewModal, setViewModal] = useState({ show: false, subscription: null });
  const [selectedIssueView, setSelectedIssueView] = useState(null);
  
  // History modal
  const [historyModal, setHistoryModal] = useState({ show: false, subscription: null });

  useEffect(() => {
    fetchTPUData();
  }, []);

  const fetchTPUData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/subscriptions/tpu-delivery-tracking');
      
      if (response.data.success) {
        setSubscriptions(response.data.subscriptions || []);
        setStats(response.data.stats || { total: 0, delivered: 0, ongoing: 0 });
      }
    } catch (err) {
      console.error('Error fetching TPU data:', err);
      setError('Failed to load delivery data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      (sub.serialTitle && sub.serialTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.supplierName && sub.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.issn && sub.issn.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || sub.aggregatedStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleToggleRow = (subscriptionId) => {
    setExpandedRow(expandedRow === subscriptionId ? null : subscriptionId);
  };

  // Status helpers
  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#fff3cd', text: '#856404' },
      prepare: { bg: '#d1ecf1', text: '#0c5460' },
      for_delivery: { bg: '#e2d4f0', text: '#6f42c1' },
      received: { bg: '#cce5ff', text: '#004085' },
      delivered: { bg: '#28a745', text: '#ffffff' },
      for_return: { bg: '#f8d7da', text: '#721c24' },
    };
    return colors[status] || { bg: '#e2e3e5', text: '#383d41' };
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      prepare: 'Preparing',
      for_delivery: 'For Delivery',
      received: 'Received',
      delivered: 'Delivered',
      for_return: 'For Return',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Enhanced resolveFileUrl with better path handling and caching
  const urlCache = useRef({});
  const resolveFileUrl = (rawUrl) => {
    if (!rawUrl) return null;
    if (urlCache.current[rawUrl]) return urlCache.current[rawUrl];
    
    const normalized = String(rawUrl).trim().replace(/\\/g, '/');
    let resolved;
    
    // Handle various URL formats
    if (/^https?:\/\//i.test(normalized) || normalized.startsWith('data:')) {
      resolved = encodeURI(normalized);
    } else if (normalized.startsWith('/uploads/') || normalized.startsWith('/storage/')) {
      resolved = encodeURI(normalized);
    } else if (normalized.startsWith('uploads/') || normalized.startsWith('storage/')) {
      resolved = encodeURI(`/${normalized}`);
    } else if (normalized.startsWith('public/uploads/') || normalized.startsWith('public/storage/')) {
      resolved = encodeURI(normalized.replace(/^public/, ''));
    } else if (normalized.startsWith('public/')) {
      resolved = encodeURI(normalized.replace(/^public\//, '/storage/'));
    } else {
      resolved = encodeURI(normalized.startsWith('/') ? normalized : `/${normalized}`);
    }
    
    urlCache.current[rawUrl] = resolved;
    return resolved;
  };

  const isImageFile = (rawUrl) => {
    if (!rawUrl) return false;
    const clean = String(rawUrl).split('?')[0].toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(clean);
  };

  // Get completed issues (delivered or for_return) for view modal
  const getCompletedIssues = (subscription) => {
    return (subscription.issues || []).filter(i => ['delivered', 'for_return'].includes(i.status));
  };

  // Stats cards
  const statsCards = [
    { title: 'Total Subscriptions', value: stats.total, icon: <FiPackage />, color: '#004A98', bgColor: '#E8F1FA' },
    { title: 'Ongoing', value: stats.ongoing, icon: <FiClock />, color: '#D97706', bgColor: '#FEF3C7' },
    { title: 'Delivered', value: stats.delivered, icon: <FiCheckCircle />, color: '#0D9488', bgColor: '#E6F7F5' },
  ];

  return (
    <div style={{ background: '#f5f7fa', minHeight: 'calc(100vh - 73px)', padding: '24px 32px' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        {statsCards.map((stat, index) => (
          <div key={index} style={{ background: stat.bgColor, borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${stat.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0', fontWeight: 500 }}>{stat.title}</h3>
                <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: stat.color }}>{stat.value}</p>
              </div>
              <div style={{ color: stat.color, fontSize: 24, opacity: 0.8 }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: '#004A98', margin: '0 0 8px 0', fontSize: 20 }}>Monitor Delivery</h2>
            <p style={{ color: '#666', margin: 0, fontSize: 14 }}>Click ISSN to view serial issues and track progress</p>
          </div>
          <button onClick={fetchTPUData} disabled={loading} style={{ background: '#004A98', border: 'none', color: '#fff', padding: '12px 20px', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MdRefresh /> {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input type="text" placeholder="Search serial title, supplier, or ISSN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '12px 16px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, background: '#fff', minWidth: 150 }}>
            <option value="All">All Status</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Delivered">Delivered</option>
          </select>
          <button onClick={() => { setSearchTerm(''); setStatusFilter('All'); }} style={{ padding: '12px 20px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 14, color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MdFilterList /> Clear
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #004A98, #0062f4)', color: '#fff' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>ISSN</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Serial Title</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Supplier</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Issues</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>{error} <button onClick={fetchTPUData} style={{ marginLeft: 16, padding: '8px 16px', background: '#004A98', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Retry</button></td></tr>
              ) : filteredSubscriptions.length > 0 ? (
                filteredSubscriptions.map((sub, index) => {
                  const isExpanded = expandedRow === sub.id;
                  return (
                    <React.Fragment key={sub.id}>
                      <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #eee', background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                        <td style={{ padding: '16px', cursor: 'pointer', color: '#004A98' }} onClick={() => handleToggleRow(sub.id)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', background: '#E8F1FA', borderRadius: 4 }}>
                              {isExpanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                            </span>
                            <span style={{ fontWeight: 600 }}>{sub.issn || 'N/A'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>{sub.serialTitle}</td>
                        <td style={{ padding: '16px' }}>{sub.supplierName}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#004A98' }}>{sub.deliveredIssues}</span>
                          <span style={{ color: '#666' }}> / {sub.totalIssues}</span>
                          {sub.forReturnCount > 0 && <span style={{ color: '#dc3545', marginLeft: 8, fontSize: 12 }}>({sub.forReturnCount} for return)</span>}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ padding: '6px 16px', borderRadius: 20, background: sub.aggregatedStatus === 'Delivered' ? '#d4edda' : '#fff3cd', color: sub.aggregatedStatus === 'Delivered' ? '#155724' : '#856404', fontSize: 12, fontWeight: 500 }}>
                            {sub.aggregatedStatus}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button onClick={() => { setViewModal({ show: true, subscription: sub }); setSelectedIssueView(null); }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #17a2b8', background: '#f8f9fa', color: '#17a2b8', cursor: 'pointer', fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <MdVisibility size={14} /> View
                            </button>
                            <button onClick={() => setHistoryModal({ show: true, subscription: sub })} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #004A98', background: '#f8f9fa', color: '#004A98', cursor: 'pointer', fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <FaHistory size={10} /> History
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Issues Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="6" style={{ padding: 0 }}>
                            <div style={{ background: '#f8f9fa', padding: '16px 24px', borderBottom: '2px solid #004A98' }}>
                              <h4 style={{ margin: '0 0 12px', color: '#004A98', fontSize: 14, fontWeight: 600 }}>Serial Issues for {sub.serialTitle}</h4>
                              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8 }}>
                                <thead>
                                  <tr style={{ background: '#e9ecef' }}>
                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>Issue #</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Supplier</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Expected Delivery</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>Status</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontSize: 12 }}>Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(sub.issues || []).map((issue) => {
                                    const statusColor = getStatusColor(issue.status);
                                    return (
                                      <tr key={issue.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#004A98' }}>#{issue.issue_number}</td>
                                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{issue.supplier_name || sub.supplierName}</td>
                                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{formatDate(issue.expected_delivery_date)}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                          <span style={{ padding: '4px 10px', borderRadius: 20, background: statusColor.bg, color: statusColor.text, fontSize: 11, fontWeight: 500 }}>
                                            {getStatusLabel(issue.status)}
                                          </span>
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#004A98', fontSize: 13 }}>
                                          ₱{parseFloat(issue.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No subscriptions with issues found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, color: '#666', fontSize: 14 }}>
          <div>Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions</div>
        </div>
      </div>

      {/* View Modal with Issue Selection */}
      {viewModal.show && viewModal.subscription && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setViewModal({ show: false, subscription: null })}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', maxWidth: 700, width: '90%', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', color: '#004A98' }}>Completed Issues</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{viewModal.subscription.serialTitle}</p>
              </div>
              <button onClick={() => setViewModal({ show: false, subscription: null })} style={{ background: 'transparent', border: 'none', fontSize: 24, color: '#999', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#333' }}>Select Issue ({getCompletedIssues(viewModal.subscription).length} completed)</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {getCompletedIssues(viewModal.subscription).length === 0 ? (
                  <p style={{ color: '#888', fontSize: 14 }}>No completed issues yet.</p>
                ) : (
                  getCompletedIssues(viewModal.subscription).map((issue) => (
                    <button key={issue.id} onClick={() => setSelectedIssueView(issue)} style={{ padding: '8px 16px', border: selectedIssueView?.id === issue.id ? '2px solid #004A98' : '1px solid #ddd', borderRadius: 6, background: selectedIssueView?.id === issue.id ? '#E8F1FA' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: selectedIssueView?.id === issue.id ? 600 : 400 }}>
                      Issue #{issue.issue_number} {issue.status === 'for_return' && <span style={{ color: '#dc3545' }}>⚠</span>}
                    </button>
                  ))
                )}
              </div>
            </div>

            {selectedIssueView && (
              <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20 }}>
                <h4 style={{ margin: '0 0 16px', color: '#004A98' }}>Issue #{selectedIssueView.issue_number} Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 16 }}>
                  <div><span style={{ color: '#666' }}>Status:</span> <strong style={{ color: selectedIssueView.status === 'for_return' ? '#721c24' : '#155724' }}>{getStatusLabel(selectedIssueView.status)}</strong></div>
                  <div><span style={{ color: '#666' }}>Cost:</span> <strong>₱{parseFloat(selectedIssueView.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                  <div><span style={{ color: '#666' }}>Delivered:</span> <strong>{formatDate(selectedIssueView.delivered_at)}</strong></div>
                  <div><span style={{ color: '#666' }}>Inspector:</span> <strong>{selectedIssueView.inspector_name || 'N/A'}</strong></div>
                  <div><span style={{ color: '#666' }}>Condition:</span> <strong>{selectedIssueView.condition || 'N/A'}</strong></div>
                  {selectedIssueView.inspection_remarks && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#666' }}>Remarks:</span> <strong>{selectedIssueView.inspection_remarks}</strong></div>}
                </div>
                
                {/* Attachments */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div>
                    <h5 style={{ margin: '0 0 8px', color: '#333', fontSize: 13 }}>Receipt Image</h5>
                    {(() => {
                      const fileUrl = resolveFileUrl(selectedIssueView.attachment_url || selectedIssueView.receipt_attachment);
                      const isImage = fileUrl && isImageFile(fileUrl);
                      
                      if (!fileUrl) {
                        return <div style={{ padding: 20, textAlign: 'center', background: '#fff', borderRadius: 8, color: '#999', fontSize: 12 }}>No attachment</div>;
                      }
                      
                      return isImage ? (
                        <img
                          src={fileUrl}
                          alt="Receipt"
                          loading="lazy"
                          style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#f0f0f0' }}
                          onClick={() => window.open(fileUrl, '_blank')}
                          onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div style="padding:20px;text-align:center;background:#fff;borderRadius:8px;color:#999;fontSize:12px;">Image failed to load</div>'; }}
                        />
                      ) : (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-block', padding: '10px 16px', background: '#004A98', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}
                        >
                          Open Document
                        </a>
                      );
                    })()}
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 8px', color: '#333', fontSize: 13 }}>Inspection Image</h5>
                    {(() => {
                      const fileUrl = resolveFileUrl(selectedIssueView.inspection_attachment);
                      const isImage = fileUrl && isImageFile(fileUrl);
                      
                      if (!fileUrl) {
                        return <div style={{ padding: 20, textAlign: 'center', background: '#fff', borderRadius: 8, color: '#999', fontSize: 12 }}>No attachment</div>;
                      }
                      
                      return isImage ? (
                        <img
                          src={fileUrl}
                          alt="Inspection"
                          loading="lazy"
                          style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#f0f0f0' }}
                          onClick={() => window.open(fileUrl, '_blank')}
                          onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div style="padding:20px;text-align:center;background:#fff;borderRadius:8px;color:#999;fontSize:12px;">Image failed to load</div>'; }}
                        />
                      ) : (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-block', padding: '10px 16px', background: '#004A98', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}
                        >
                          Open Document
                        </a>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Modal with Tabs */}
      {historyModal.show && historyModal.subscription && (
        <HistoryModalWithTabs subscription={historyModal.subscription} onClose={() => setHistoryModal({ show: false, subscription: null })} getStatusLabel={getStatusLabel} />
      )}
    </div>
  );
}

// History Modal with Tabs (Subscription Flow & Serial Issues Flow)
function HistoryModalWithTabs({ subscription, onClose, getStatusLabel }) {
  const [activeTab, setActiveTab] = useState('subscription');
  const [selectedIssueTab, setSelectedIssueTab] = useState(null);
  const issues = subscription.issues || [];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px', maxWidth: 800, width: '90%', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', color: '#004A98' }}>History</h3>
            <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{subscription.serialTitle}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 24, color: '#999', cursor: 'pointer' }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          <button onClick={() => { setActiveTab('subscription'); setSelectedIssueTab(null); }} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px 8px 0 0', background: activeTab === 'subscription' ? '#004A98' : '#e9ecef', color: activeTab === 'subscription' ? '#fff' : '#495057', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            Subscription Flow
          </button>
          <button onClick={() => setActiveTab('issues')} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px 8px 0 0', background: activeTab === 'issues' ? '#004A98' : '#e9ecef', color: activeTab === 'issues' ? '#fff' : '#495057', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            Serial Issues Flow
          </button>
        </div>

        {/* Subscription Flow Tab */}
        {activeTab === 'subscription' && (
          <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <HistoryStep title="Created" description="Subscription created by TPU" done timestamp={subscription.created_at} />
              <HistoryStep title="Pending" description="Sent to supplier for acceptance" done timestamp={subscription.pending_at} />
              <HistoryStep title="Accepted" description="Supplier accepted the subscription" done timestamp={subscription.accepted_at || subscription.issues?.[0]?.prepared_at || subscription.issues?.[0]?.for_delivery_at || subscription.issues?.[0]?.received_at || subscription.issues?.[0]?.inspected_at} />
              {subscription.aggregatedStatus === 'Delivered' && (
                <HistoryStep title="Delivered" description="All issues have been delivered" done />
              )}
            </div>
          </div>
        )}

        {/* Serial Issues Flow Tab */}
        {activeTab === 'issues' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {issues.length === 0 ? (
                <p style={{ color: '#888', fontSize: 14 }}>No issues created for this subscription.</p>
              ) : (
                issues.map((issue) => (
                  <button key={issue.id} onClick={() => setSelectedIssueTab(issue)} style={{ padding: '8px 16px', border: selectedIssueTab?.id === issue.id ? '2px solid #004A98' : '1px solid #ddd', borderRadius: 6, background: selectedIssueTab?.id === issue.id ? '#E8F1FA' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: selectedIssueTab?.id === issue.id ? 600 : 400 }}>
                    Issue #{issue.issue_number}
                  </button>
                ))
              )}
            </div>

            {selectedIssueTab ? (
              <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20 }}>
                <h4 style={{ margin: '0 0 16px', color: '#004A98' }}>Issue #{selectedIssueTab.issue_number} Timeline</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <HistoryStep title="Pending" description="Issue created for the subscription" done timestamp={selectedIssueTab.created_at || selectedIssueTab.expected_delivery_date} />
                  {['prepare', 'for_delivery', 'received', 'delivered', 'for_return'].includes(selectedIssueTab.status) && (
                    <HistoryStep title="Preparing" description="Supplier is preparing the issue" done timestamp={selectedIssueTab.prepared_at || selectedIssueTab.for_delivery_at || selectedIssueTab.received_at || selectedIssueTab.inspected_at} />
                  )}
                  {['for_delivery', 'received', 'delivered', 'for_return'].includes(selectedIssueTab.status) && (
                    <HistoryStep title="For Delivery" description="Ready for delivery to GSPS" done timestamp={selectedIssueTab.for_delivery_at || selectedIssueTab.received_at || selectedIssueTab.inspected_at} />
                  )}
                  {['received', 'delivered', 'for_return'].includes(selectedIssueTab.status) && (
                    <HistoryStep title="Received" description="Received and confirmed by GSPS" done timestamp={selectedIssueTab.received_at} />
                  )}
                  {selectedIssueTab.status === 'delivered' && (
                    <HistoryStep title="Delivered" description="Inspected and marked as acceptable" done timestamp={selectedIssueTab.inspected_at} />
                  )}
                  {selectedIssueTab.status === 'for_return' && (
                    <HistoryStep title="For Return" description="Inspected and marked for return to supplier" done isReturn timestamp={selectedIssueTab.inspected_at} />
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#666', background: '#f8f9fa', borderRadius: 12 }}>
                Select an issue to view its timeline
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateTime(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// History Step Component
function HistoryStep({ title, description, done = false, isReturn = false, timestamp = null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: done ? (isReturn ? '#dc3545' : '#28a745') : '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {done && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 600, color: done ? '#333' : '#999' }}>{title}</div>
          {timestamp && done && (
            <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>
              {formatDateTime(timestamp)}
            </div>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#666' }}>{description}</div>
      </div>
    </div>
  );
}

export default function DashboardTPUMonitorDelivery() {
  return (
    <TPULayout title="Monitor Delivery">
      <MonitorDelivery />
    </TPULayout>
  );
}
