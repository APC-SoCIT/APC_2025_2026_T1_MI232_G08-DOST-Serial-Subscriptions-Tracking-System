import InspectionLayout from "@/Layouts/InspectionLayout";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaHistory } from "react-icons/fa";
import { MdExpandMore, MdExpandLess, MdRefresh, MdVisibility } from "react-icons/md";

export default function ListOfSerials() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewModal, setViewModal] = useState({ show: false, subscription: null });
  const [historyModal, setHistoryModal] = useState({ show: false, subscription: null });
  const [activeTab, setActiveTab] = useState('subscription');
  const [selectedIssueTab, setSelectedIssueTab] = useState(null);
  const [imageErrors, setImageErrors] = useState({}); // Track image load errors by issue ID and type
  const perPage = 4; // number of rows per page
  const urlCache = useRef({});

  // Enhanced resolveFileUrl with better path handling and path remapping
  const resolveFileUrl = (rawUrl) => {
    if (!rawUrl) return null;
    
    const str = String(rawUrl).trim();
    if (!str || str === 'null' || str === 'undefined') return null;
    
    const normalized = str.replace(/\\/g, '/');
    let resolved = normalized;
    
    // Fix incorrect /storage/serial-issues/ paths - remap to correct locations
    if (normalized.startsWith('/storage/serial-issues/')) {
      // Extract filename
      const filename = normalized.split('/').pop();
      // Determine if it's an inspection or regular attachment based on filename prefix
      if (filename.startsWith('inspection_')) {
        resolved = `/storage/inspection-attachments/${filename}`;
      } else if (filename.startsWith('issue_')) {
        resolved = `/storage/serial-attachments/${filename}`;
      } else {
        // Assume it's a serial attachment
        resolved = `/storage/serial-attachments/${filename}`;
      }
    } else if (/^https?:\/\//i.test(normalized) || normalized.startsWith('data:')) {
      resolved = normalized;
    } else if (normalized.startsWith('/uploads/') || normalized.startsWith('/storage/')) {
      resolved = normalized;
    } else if (normalized.startsWith('uploads/') || normalized.startsWith('storage/')) {
      resolved = `/${normalized}`;
    } else if (normalized.startsWith('public/uploads/') || normalized.startsWith('public/storage/')) {
      resolved = normalized.replace(/^public/, '');
    } else if (normalized.startsWith('public/')) {
      resolved = normalized.replace(/^public\//, '/storage/');
    } else if (!normalized.startsWith('/')) {
      resolved = `/${normalized}`;
    }
    
    return resolved;
  };

  const isImageFile = (rawUrl) => {
    if (!rawUrl) return false;
    const clean = String(rawUrl).split('?')[0].toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(clean);
  };

  // Fetch issues from API
  useEffect(() => {
    fetchIssues();
  }, []);

  // Clear image errors when switching between issues to prevent persistent error states
  useEffect(() => {
    setImageErrors(prev => {
      const newErrors = { ...prev };
      if (selectedIssueTab) {
        // Clear errors for the current issue
        delete newErrors[`issue_${selectedIssueTab.id}_gsps`];
        delete newErrors[`issue_${selectedIssueTab.id}_inspection`];
      }
      return newErrors;
    });
  }, [selectedIssueTab?.id]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/subscriptions/inspection-tracking');
      
      if (response.data.success) {
        setSubscriptions(response.data.subscriptions || []);
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError('Failed to load issues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date to readable words (e.g., "December 10, 2025")
  const formatDateToWords = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format inspection status for display
  const formatInspectionStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'prepare':
        return 'Preparing';
      case 'for_delivery':
        return 'For Delivery';
      case 'received':
        return 'Received';
      case 'delivered':
        return 'Delivered';
      case 'for_return':
        return 'For Return';
      default:
        return status || 'Unknown';
    }
  };

  // Get status badge styling
  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#fff3cd', text: '#856404' },
      prepare: { bg: '#d1ecf1', text: '#0c5460' },
      for_delivery: { bg: '#e2d4f0', text: '#6f42c1' },
      received: { bg: '#cce5ff', text: '#004085' },
      delivered: { bg: '#d4edda', text: '#155724' },
      for_return: { bg: '#f8d7da', text: '#721c24' },
    };
    return colors[status] || { bg: '#e2e3e5', text: '#383d41' };
  };

  // Normalize date to YYYY-MM-DD format
  const normalizeDate = (dateString) => {
    if (!dateString) return null;
    // Handle various date formats and extract just the date part
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    // Return in YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  };

  // Flatten issues from subscriptions for table display
  const getAllIssues = () => {
    const allIssues = [];
    subscriptions.forEach(sub => {
      if (sub.issues && sub.issues.length > 0) {
        sub.issues.forEach(issue => {
          allIssues.push({
            ...issue,
            subscription_id: sub.subscription_id,
            serialTitle: sub.serialTitle,
            issn: sub.issn,
            supplierName: sub.supplierName,
            created_at: sub.created_at,
            accepted_at: sub.accepted_at,
            subscription: sub,
          });
        });
      }
    });
    return allIssues;
  };

  // Filter issues based on date
  const allIssues = getAllIssues();
  const filteredIssues = allIssues.filter((issue) => {
    const dateToUse = normalizeDate(issue.received_at || issue.expected_delivery_date);
    
    // If any filter is set but item has no date, exclude it
    if ((filterDate || filterMonth || filterYear) && !dateToUse) return false;
    
    // If no filters are set, include all items
    if (!filterDate && !filterMonth && !filterYear) return true;
    
    const [year, month, day] = dateToUse.split("-");
    
    if (filterDate) {
      const normalizedFilterDate = normalizeDate(filterDate);
      if (dateToUse !== normalizedFilterDate) return false;
    }
    if (filterMonth && month !== filterMonth) return false;
    if (filterYear && year !== filterYear) return false;
    
    return true;
  });

  const handleToggleRow = (issueId) => {
    setExpandedRow(expandedRow === issueId ? null : issueId);
  };

  const totalPages = Math.ceil(filteredIssues.length / perPage);
  const paginatedData = filteredIssues.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <InspectionLayout header="List of Serials">
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#004A98' }}>List of Serials</h2>
      <p className="text-sm text-gray-500 mb-6">
        Complete list of all serial issues in the system.
      </p>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        {/* Date Filters */}
        <div className="mb-6 pb-6 border-b border-gray-300">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Filter by Date</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Specific Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Month</label>
              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Year</label>
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                <option value="2020">2020</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>
          {(filterDate || filterMonth || filterYear) && (
            <button
              onClick={() => {
                setFilterDate("");
                setFilterMonth("");
                setFilterYear("");
                setCurrentPage(1);
              }}
              className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading issues...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchIssues}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: 'linear-gradient(90deg, #004A98, #0062f4)', color: '#fff' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>ISSN</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Serial Title</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Issue No</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Supplier</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Received Date</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Status</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((issue, index) => (
                      <tr key={issue.id || index} style={{ borderBottom: '1px solid #eee', background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                        <td style={{ padding: '16px' }}>
                          <span style={{ fontWeight: 600 }}>{issue.issn || 'N/A'}</span>
                        </td>
                        <td style={{ padding: '16px' }}>{issue.serialTitle || 'N/A'}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ fontWeight: 500, color: '#004A98' }}>#{issue.issue_number || 'N/A'}</span>
                        </td>
                        <td style={{ padding: '16px' }}>{issue.supplierName || 'N/A'}</td>
                        <td style={{ padding: '16px' }}>{formatDateToWords(issue.received_at || issue.expected_delivery_date)}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ ...getStatusColor(issue.status), padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                            {formatInspectionStatus(issue.status)}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button onClick={() => { setViewModal({ show: true, subscription: issue.subscription }); setSelectedIssueTab(issue); }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #17a2b8', background: '#f8f9fa', color: '#17a2b8', cursor: 'pointer', fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <MdVisibility size={14} /> View
                            </button>
                            <button onClick={() => setHistoryModal({ show: true, subscription: issue.subscription })} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #6c757d', background: '#f8f9fa', color: '#6c757d', cursor: 'pointer', fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <FaHistory size={12} /> History
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        No issues found for the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-end mt-4 gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">{currentPage} / {totalPages || 1}</span>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* View Modal */}
      {viewModal.show && viewModal.subscription && selectedIssueTab && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setViewModal({ show: false, subscription: null })}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', maxWidth: 700, width: '90%', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', color: '#004A98' }}>Issue #{selectedIssueTab.issue_number}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{selectedIssueTab.serialTitle}</p>
              </div>
              <button onClick={() => setViewModal({ show: false, subscription: null })} style={{ background: 'transparent', border: 'none', fontSize: 24, color: '#999', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20 }}>
              <h4 style={{ margin: '0 0 16px', color: '#004A98' }}>Issue #{selectedIssueTab.issue_number} Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 24 }}>
                <div><span style={{ color: '#666' }}>Received:</span> <strong>{formatDate(selectedIssueTab.received_at)}</strong></div>
                <div><span style={{ color: '#666' }}>Inspected:</span> <strong>{formatDate(selectedIssueTab.inspected_at)}</strong></div>
                <div><span style={{ color: '#666' }}>Expected Delivery:</span> <strong>{formatDate(selectedIssueTab.expected_delivery_date)}</strong></div>
                <div><span style={{ color: '#666' }}>Status:</span> <strong>{formatInspectionStatus(selectedIssueTab.status)}</strong></div>
                <div><span style={{ color: '#666' }}>Inspector:</span> <strong>{selectedIssueTab.inspector_name || 'N/A'}</strong></div>
                <div><span style={{ color: '#666' }}>Condition:</span> <strong style={{ color: selectedIssueTab.status === 'for_return' ? '#721c24' : '#155724' }}>{selectedIssueTab.condition || 'N/A'}</strong></div>
              </div>

              {/* Attachments Section */}
              <h4 style={{ margin: '24px 0 16px', color: '#004A98' }}>Attachments</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* GSPS Receipt Attachment */}
                <div>
                  <h5 style={{ margin: '0 0 8px', color: '#333', fontSize: 14 }}>GSPS Receipt Attachment</h5>
                  {(() => {
                    // GSPS receipt comes from the serial submission (attachment_url field)
                    const attachmentUrl = selectedIssueTab?.attachment_url || selectedIssueTab?.receipt_attachment;
                    
                    if (!attachmentUrl || !String(attachmentUrl).trim() || String(attachmentUrl).trim() === 'null') {
                      if (['pending', 'for_delivery'].includes(selectedIssueTab?.status)) {
                        return <div style={{ padding: 20, textAlign: 'center', background: '#fff', borderRadius: 8, color: '#999', fontSize: 12 }}>No attachment yet</div>;
                      }
                      return <div style={{ padding: 20, textAlign: 'center', background: '#fff', borderRadius: 8, color: '#999', fontSize: 12 }}>No attachment</div>;
                    }
                    
                    const fileUrl = resolveFileUrl(attachmentUrl);
                    const isImage = fileUrl && isImageFile(fileUrl);
                    const errorKey = `issue_${selectedIssueTab?.id}_gsps`;
                    const hasError = imageErrors[errorKey];
                    
                    if (hasError) {
                      return <div style={{ padding: 20, textAlign: 'center', background: '#fff', borderRadius: 8, color: '#d32f2f', fontSize: 12 }}>
                        Failed to load attachment<br/><small style={{ color: '#999' }}>{fileUrl}</small>
                      </div>;
                    }
                    
                    if (!isImage) {
                      return (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 16px', background: '#004A98', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}>
                          📄 Open Document
                        </a>
                      );
                    }
                    
                    return (
                      <img 
                        key={`gsps_${selectedIssueTab?.id}`}
                        src={`${fileUrl}?t=${Date.now()}`}
                        alt="GSPS Receipt" 
                        style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#f0f0f0' }} 
                        onClick={() => window.open(fileUrl, '_blank')}
                        onError={() => { 
                          console.error('Failed to load GSPS image:', fileUrl);
                          setImageErrors(prev => ({ ...prev, [errorKey]: true }));
                        }}
                        onLoad={() => {
                          console.log('GSPS image loaded:', fileUrl);
                          setImageErrors(prev => ({ ...prev, [errorKey]: false }));
                        }}
                      />
                    );
                  })()}
                </div>

                {/* Inspection Attachment */}
                <div>
                  <h5 style={{ margin: '0 0 8px', color: '#333', fontSize: 14 }}>Inspection Attachment</h5>
                  {(() => {
                    const inspectionUrl = selectedIssueTab?.inspection_attachment;
                    
                    if (!inspectionUrl || !String(inspectionUrl).trim() || String(inspectionUrl).trim() === 'null') {
                      if (['pending', 'for_delivery'].includes(selectedIssueTab?.status)) {
                        return <div style={{ padding: 20, textAlign: 'center', background: '#fff', borderRadius: 8, color: '#999', fontSize: 12 }}>No attachment yet</div>;
                      }
                      return <div style={{ padding: 20, textAlign: 'center', background: '#fff', borderRadius: 8, color: '#999', fontSize: 12 }}>No attachment</div>;
                    }
                    
                    const fileUrl = resolveFileUrl(inspectionUrl);
                    const isImage = fileUrl && isImageFile(fileUrl);
                    const errorKey = `issue_${selectedIssueTab?.id}_inspection`;
                    const hasError = imageErrors[errorKey];
                    
                    if (hasError) {
                      return <div style={{ padding: 20, textAlign: 'center', background: '#fff', borderRadius: 8, color: '#d32f2f', fontSize: 12 }}>
                        Failed to load attachment<br/><small style={{ color: '#999' }}>{fileUrl}</small>
                      </div>;
                    }
                    
                    if (!isImage) {
                      return (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 16px', background: '#004A98', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}>
                          📄 Open Document
                        </a>
                      );
                    }
                    
                    return (
                      <img 
                        key={`inspection_${selectedIssueTab?.id}`}
                        src={`${fileUrl}?t=${Date.now()}`}
                        alt="Inspection Attachment" 
                        style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#f0f0f0' }} 
                        onClick={() => window.open(fileUrl, '_blank')}
                        onError={() => { 
                          console.error('Failed to load inspection image:', fileUrl);
                          setImageErrors(prev => ({ ...prev, [errorKey]: true }));
                        }}
                        onLoad={() => {
                          console.log('Inspection image loaded:', fileUrl);
                          setImageErrors(prev => ({ ...prev, [errorKey]: false }));
                        }}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal.show && historyModal.subscription && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setHistoryModal({ show: false, subscription: null })}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', maxWidth: 800, width: '90%', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', color: '#004A98' }}>History</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{historyModal.subscription.serialTitle}</p>
              </div>
              <button onClick={() => setHistoryModal({ show: false, subscription: null })} style={{ background: 'transparent', border: 'none', fontSize: 24, color: '#999', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              <button onClick={() => setActiveTab('subscription')} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px 8px 0 0', background: activeTab === 'subscription' ? '#004A98' : '#e9ecef', color: activeTab === 'subscription' ? '#fff' : '#495057', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Subscription Flow</button>
              <button onClick={() => setActiveTab('issues')} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px 8px 0 0', background: activeTab === 'issues' ? '#004A98' : '#e9ecef', color: activeTab === 'issues' ? '#fff' : '#495057', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Serial Issues Flow</button>
            </div>

            {activeTab === 'subscription' && (
              <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <HistoryStep title="Created" description="Subscription created" done timestamp={historyModal.subscription.created_at} />
                  <HistoryStep title="Pending" description="Sent to supplier for acceptance" done timestamp={historyModal.subscription.pending_at} />
                  <HistoryStep title="Accepted" description="Accepted by supplier" done timestamp={historyModal.subscription.accepted_at} />
                  {historyModal.subscription.aggregatedStatus === 'Delivered' && <HistoryStep title="Delivered" description="All issues delivered" done />}
                </div>
              </div>
            )}

            {activeTab === 'issues' && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {(historyModal.subscription.issues || []).map((issue) => (
                    <button key={issue.id} onClick={() => setSelectedIssueTab(issue)} style={{ padding: '8px 16px', border: selectedIssueTab?.id === issue.id ? '2px solid #004A98' : '1px solid #ddd', borderRadius: 6, background: selectedIssueTab?.id === issue.id ? '#E8F1FA' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: selectedIssueTab?.id === issue.id ? 600 : 400 }}>Issue #{issue.issue_number}</button>
                  ))}
                </div>
                {selectedIssueTab && (historyModal.subscription.issues || []).find(i => i.id === selectedIssueTab.id) ? (
                  <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20 }}>
                    <h4 style={{ margin: '0 0 16px', color: '#004A98' }}>Issue #{selectedIssueTab.issue_number} Timeline</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <HistoryStep title="Pending" description="Issue created" done timestamp={selectedIssueTab.created_at} />
                      {['prepare', 'for_delivery', 'received', 'delivered', 'for_return'].includes(selectedIssueTab.status) && <HistoryStep title="Preparing" description="Supplier preparing" done timestamp={selectedIssueTab.prepared_at} />}
                      {['for_delivery', 'received', 'delivered', 'for_return'].includes(selectedIssueTab.status) && <HistoryStep title="For Delivery" description="Ready for delivery" done timestamp={selectedIssueTab.for_delivery_at} />}
                      {['received', 'delivered', 'for_return'].includes(selectedIssueTab.status) && <HistoryStep title="Received" description="Received by GSPS" done timestamp={selectedIssueTab.received_at} />}
                      {selectedIssueTab.status === 'delivered' && <HistoryStep title="Delivered" description="Inspected - Acceptable" done timestamp={selectedIssueTab.inspected_at} />}
                      {selectedIssueTab.status === 'for_return' && <HistoryStep title="For Return" description="Inspected - Marked for return" done isReturn timestamp={selectedIssueTab.inspected_at} />}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: '#666', background: '#f8f9fa', borderRadius: 12 }}>Select an issue to view timeline</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </InspectionLayout>
  );
}

function HistoryStep({ title, description, done = false, isReturn = false, timestamp = null }) {
  const formatDateTime = (dateString) => {
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
  };

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
