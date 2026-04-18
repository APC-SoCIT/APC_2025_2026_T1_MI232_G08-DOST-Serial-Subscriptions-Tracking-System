import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import InspectionLayout from '@/Layouts/InspectionLayout';
import { usePage } from '@inertiajs/react';
import { MdSearch, MdRefresh, MdExpandMore, MdExpandLess, MdVisibility, MdCloudUpload, MdClose, MdCheckCircle, MdWarning } from "react-icons/md";
import { FiPackage, FiCheckCircle, FiClock, FiAlertTriangle } from "react-icons/fi";
import { FaHistory } from "react-icons/fa";
import Swal from 'sweetalert2';
import 'animate.css';

// Inspection Serials for Inspection Page
function SerialsForInspection() {
  const { auth } = usePage().props;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // API data state
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({ total: 0, delivered: 0, ongoing: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Expanded row state
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Inspection modal
  const [inspectionModal, setInspectionModal] = useState({ show: false, issue: null, subscription: null });
  const [inspectionForm, setInspectionForm] = useState({
    condition: '',
    checklist: { missingPages: false, tornPages: false, waterDamage: false, misprint: false, other: false },
    otherDescription: '',
    remarks: '',
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // View modal
  const [viewModal, setViewModal] = useState({ show: false, subscription: null });
  const [selectedIssueView, setSelectedIssueView] = useState(null);
  const [imageErrors, setImageErrors] = useState({}); // Track image load errors by issue ID and type
  
  // History modal
  const [historyModal, setHistoryModal] = useState({ show: false, subscription: null });

  useEffect(() => {
    fetchInspectionData();
  }, []);

  // Clear image errors when switching between issues to prevent persistent error states
  useEffect(() => {
    setImageErrors(prev => {
      const newErrors = { ...prev };
      if (selectedIssueView) {
        // Clear errors for the current issue
        delete newErrors[`issue_${selectedIssueView.id}_gsps`];
        delete newErrors[`issue_${selectedIssueView.id}_inspection`];
      }
      return newErrors;
    });
  }, [selectedIssueView?.id]);

  const fetchInspectionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/subscriptions/inspection-tracking');
      
      if (response.data.success) {
        setSubscriptions(response.data.subscriptions || []);
        setStats(response.data.stats || { total: 0, delivered: 0, ongoing: 0 });
      }
    } catch (err) {
      console.error('Error fetching inspection data:', err);
      setError('Failed to load inspection data. Please try again.');
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
      received: 'Pending',
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

  // Enhanced resolveFileUrl with better path handling and path remapping
  const urlCache = useRef({});
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

  // File handling
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({ title: 'Please select an image (JPG, PNG) or PDF file', icon: 'warning', confirmButtonColor: '#0062f4', zIndex: 10001 });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({ title: 'Maximum 10 MB file size', icon: 'warning', confirmButtonColor: '#0062f4', zIndex: 10001 });
        e.target.value = '';
        return;
      }
      setAttachmentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAttachmentPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Open inspection modal
  const handleOpenInspection = (issue, subscription) => {
    setInspectionModal({ show: true, issue, subscription });
    setInspectionForm({
      condition: '',
      decision: '', // 'acceptable' or 'for_return'
      checklist: { missingPages: false, tornPages: false, waterDamage: false, misprint: false, other: false },
      otherDescription: '',
      remarks: '',
    });
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  const handleCloseInspectionModal = () => {
    setInspectionModal({ show: false, issue: null, subscription: null });
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  // Check if submit buttons should be enabled
  const canSubmit = () => {
    if (!attachmentFile) return false;
    if (!inspectionForm.decision) return false;
    // For return: at least one checklist item required
    if (inspectionForm.decision === 'for_return') {
      const hasChecklistItem = Object.values(inspectionForm.checklist).some(v => v);
      if (!hasChecklistItem) return false;
      if (inspectionForm.checklist.other && !inspectionForm.otherDescription.trim()) return false;
    }
    return true;
  };

  // Submit inspection
  const handleSubmitInspection = async () => {
    if (!inspectionModal.issue || !inspectionModal.subscription) return;

    const isForReturn = inspectionForm.decision === 'for_return';

    // Photo is required
    if (!attachmentFile) {
      Swal.fire({ title: 'Photo evidence is required', text: 'Please upload an image before submitting.', icon: 'warning', confirmButtonColor: '#0062f4', zIndex: 10001 });
      return;
    }

    // Decision is required
    if (!inspectionForm.decision) {
      Swal.fire({ title: 'Please select inspection result', text: 'Choose Acceptable or For Return.', icon: 'warning', confirmButtonColor: '#0062f4', zIndex: 10001 });
      return;
    }

    // For return: at least one checklist item must be selected
    if (isForReturn) {
      const hasChecklistItem = Object.values(inspectionForm.checklist).some(v => v);
      if (!hasChecklistItem) {
        Swal.fire({ title: 'Please select at least one issue', icon: 'warning', confirmButtonColor: '#0062f4', zIndex: 10001 });
        return;
      }
      // If "other" is selected, description is required
      if (inspectionForm.checklist.other && !inspectionForm.otherDescription.trim()) {
        Swal.fire({ title: 'Please provide description for "Other" issue', icon: 'warning', confirmButtonColor: '#0062f4', zIndex: 10001 });
        return;
      }
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('inspection_status', isForReturn ? 'for_return' : 'inspected');
      formData.append('inspector_name', auth?.user?.name || 'Inspector');
      formData.append('condition', isForReturn ? 'For Return' : 'Acceptable');
      formData.append('remark', inspectionForm.remarks);
      formData.append('attachment', attachmentFile);

      if (isForReturn) {
        formData.append('checklist', JSON.stringify(inspectionForm.checklist));
        formData.append('other_description', inspectionForm.otherDescription);
      }

      const response = await axios.post(
        `/api/subscriptions/${inspectionModal.subscription.subscription_id}/issues/${inspectionModal.issue.id}/inspection`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        await fetchInspectionData();
        handleCloseInspectionModal();
        Swal.fire({
          title: isForReturn ? 'Marked For Return' : 'Inspection Submitted',
          text: `Issue #${inspectionModal.issue.issue_number} ${isForReturn ? 'marked for return' : 'delivered successfully'}.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          zIndex: 10001,
        });
      } else {
        Swal.fire({ title: 'Failed to submit inspection', icon: 'error', confirmButtonColor: '#0062f4', zIndex: 10001 });
      }
    } catch (err) {
      console.error('Error submitting inspection:', err);
      Swal.fire({ title: 'Failed to submit inspection', icon: 'error', confirmButtonColor: '#0062f4', zIndex: 10001 });
    } finally {
      setUploading(false);
    }
  };

  // Get inspected issues for view modal
  const getInspectedIssues = (subscription) => {
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
            <h2 style={{ color: '#004A98', margin: '0 0 8px 0', fontSize: 20 }}>Serials for Inspection</h2>
            <p style={{ color: '#666', margin: 0, fontSize: 14 }}>Click ISSN to view and inspect serial issues</p>
          </div>
          <button onClick={fetchInspectionData} disabled={loading} style={{ background: '#004A98', border: 'none', color: '#fff', padding: '12px 20px', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
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
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>{error} <button onClick={fetchInspectionData} style={{ marginLeft: 16, padding: '8px 16px', background: '#004A98', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Retry</button></td></tr>
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
                              <h4 style={{ margin: '0 0 12px', color: '#004A98', fontSize: 14, fontWeight: 600 }}>Serial Issues for Inspection</h4>
                              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8 }}>
                                <thead>
                                  <tr style={{ background: '#e9ecef' }}>
                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>Issue #</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Supplier</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Received Date</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>Status</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(sub.issues || []).filter(i => ['received', 'delivered', 'for_return'].includes(i.status)).map((issue) => {
                                    const statusColor = getStatusColor(issue.status);
                                    return (
                                      <tr key={issue.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#004A98' }}>#{issue.issue_number}</td>
                                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{sub.supplierName}</td>
                                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{formatDate(issue.received_at)}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                          <span style={{ padding: '4px 10px', borderRadius: 20, background: statusColor.bg, color: statusColor.text, fontSize: 11, fontWeight: 500 }}>
                                            {getStatusLabel(issue.status)}
                                          </span>
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                          {issue.status === 'received' ? (
                                            <button onClick={() => handleOpenInspection(issue, sub)} style={{ padding: '6px 12px', border: 'none', borderRadius: 4, background: '#004A98', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
                                              Inspect
                                            </button>
                                          ) : (
                                            <span style={{ color: '#999', fontSize: 11 }}>
                                              {issue.status === 'delivered' ? '✓ Delivered' : '⚠ For Return'}
                                            </span>
                                          )}
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
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No subscriptions with issues pending inspection.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, color: '#666', fontSize: 14 }}>
          <div>Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions</div>
        </div>
      </div>

      {/* Inspection Modal */}
      {inspectionModal.show && inspectionModal.issue && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={handleCloseInspectionModal}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', maxWidth: 600, width: '90%', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', color: '#004A98' }}>Inspect Issue #{inspectionModal.issue?.issue_number}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{inspectionModal.subscription?.serialTitle}</p>
              </div>
              <button onClick={handleCloseInspectionModal} style={{ background: 'transparent', border: 'none', fontSize: 24, color: '#999', cursor: 'pointer' }}>×</button>
            </div>

            {/* Inspection Result Dropdown */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>
                Inspection Result <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                value={inspectionForm.decision}
                onChange={(e) => setInspectionForm(prev => ({ ...prev, decision: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 14,
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="">-- Select Result --</option>
                <option value="acceptable">✓ Acceptable</option>
                <option value="for_return">✗ For Return</option>
              </select>
            </div>

            {/* Photo Evidence - Required (show for both) */}
            {inspectionForm.decision && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>
                  Upload Attachment <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,.pdf" style={{ display: 'none' }} />
                {attachmentPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {attachmentFile?.type?.includes('image') ? (
                      <img src={attachmentPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #ddd' }} />
                    ) : (
                      <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: 8, border: '1px solid #ddd' }}>{attachmentFile?.name}</div>
                    )}
                    <button onClick={handleRemoveAttachment} style={{ position: 'absolute', top: -8, right: -8, background: '#dc3545', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MdClose size={14} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: '40px 20px', border: '2px dashed #ddd', borderRadius: 8, background: '#f8f9fa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <MdCloudUpload size={32} color="#666" />
                    <span style={{ color: '#666' }}>Click to upload image or PDF (Max 10MB)</span>
                  </button>
                )}
              </div>
            )}

            {/* Issues Found Checklist - Only show for For Return */}
            {inspectionForm.decision === 'for_return' && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>
                  Issues Found <span style={{ color: '#dc3545' }}>* (select at least one)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'missingPages', label: 'Missing Pages' },
                    { key: 'tornPages', label: 'Torn Pages' },
                    { key: 'waterDamage', label: 'Water Damage' },
                    { key: 'misprint', label: 'Misprint' },
                    { key: 'other', label: 'Other' },
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 12px', background: inspectionForm.checklist[item.key] ? '#f8d7da' : '#f8f9fa', borderRadius: 6, border: inspectionForm.checklist[item.key] ? '1px solid #721c24' : '1px solid #ddd' }}>
                      <input type="checkbox" checked={inspectionForm.checklist[item.key]} onChange={(e) => setInspectionForm(prev => ({ ...prev, checklist: { ...prev.checklist, [item.key]: e.target.checked } }))} />
                      <span style={{ color: inspectionForm.checklist[item.key] ? '#721c24' : '#333' }}>{item.label}</span>
                    </label>
                  ))}
                </div>
                {inspectionForm.checklist.other && (
                  <input type="text" placeholder="Describe other issue..." value={inspectionForm.otherDescription} onChange={(e) => setInspectionForm(prev => ({ ...prev, otherDescription: e.target.value }))} style={{ marginTop: 12, width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }} />
                )}
              </div>
            )}

            {/* Remarks - Show for both */}
            {inspectionForm.decision && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>Remarks (Optional)</label>
                <textarea value={inspectionForm.remarks} onChange={(e) => setInspectionForm(prev => ({ ...prev, remarks: e.target.value }))} placeholder="Add any additional remarks..." rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, resize: 'vertical' }} />
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={handleCloseInspectionModal} style={{ padding: '12px 24px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              {inspectionForm.decision === 'for_return' ? (
                <button onClick={handleSubmitInspection} disabled={uploading || !canSubmit()} style={{ padding: '12px 24px', border: 'none', borderRadius: 6, background: !canSubmit() ? '#ccc' : '#dc3545', color: '#fff', cursor: !canSubmit() || uploading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MdWarning size={16} /> {uploading ? 'Submitting...' : 'For Return'}
                </button>
              ) : inspectionForm.decision === 'acceptable' ? (
                <button onClick={handleSubmitInspection} disabled={uploading || !canSubmit()} style={{ padding: '12px 24px', border: 'none', borderRadius: 6, background: !canSubmit() ? '#ccc' : '#28a745', color: '#fff', cursor: !canSubmit() || uploading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MdCheckCircle size={16} /> {uploading ? 'Submitting...' : 'Submit'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal.show && viewModal.subscription && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setViewModal({ show: false, subscription: null })}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', maxWidth: 700, width: '90%', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', color: '#004A98' }}>Inspected Issues</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{viewModal.subscription.serialTitle}</p>
              </div>
              <button onClick={() => setViewModal({ show: false, subscription: null })} style={{ background: 'transparent', border: 'none', fontSize: 24, color: '#999', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#333' }}>Select Issue ({getInspectedIssues(viewModal.subscription).length} inspected)</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {getInspectedIssues(viewModal.subscription).length === 0 ? (
                  <p style={{ color: '#888', fontSize: 14 }}>No issues inspected yet.</p>
                ) : (
                  getInspectedIssues(viewModal.subscription).map((issue) => (
                    <button key={issue.id} onClick={() => setSelectedIssueView(issue)} style={{ padding: '8px 16px', border: selectedIssueView?.id === issue.id ? '2px solid #004A98' : '1px solid #ddd', borderRadius: 6, background: selectedIssueView?.id === issue.id ? '#E8F1FA' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: selectedIssueView?.id === issue.id ? 600 : 400 }}>
                      Issue #{issue.issue_number} {issue.status === 'for_return' && '⚠'}
                    </button>
                  ))
                )}
              </div>
            </div>

            {selectedIssueView && (
              <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20 }}>
                <h4 style={{ margin: '0 0 16px', color: '#004A98' }}>Issue #{selectedIssueView.issue_number} Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 16 }}>
                  <div><span style={{ color: '#666' }}>Received:</span> <strong>{formatDate(selectedIssueView.received_at)}</strong></div>
                  <div><span style={{ color: '#666' }}>Inspected:</span> <strong>{formatDate(selectedIssueView.inspected_at)}</strong></div>
                  <div><span style={{ color: '#666' }}>Inspector:</span> <strong>{selectedIssueView.inspector_name || 'N/A'}</strong></div>
                  <div><span style={{ color: '#666' }}>Condition:</span> <strong style={{ color: selectedIssueView.status === 'for_return' ? '#721c24' : '#155724' }}>{selectedIssueView.condition || 'N/A'}</strong></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <h5 style={{ margin: '0 0 8px', color: '#333', fontSize: 14 }}>GSPS Receipt Attachment</h5>
                    {(() => {
                      // GSPS receipt comes from the serial submission (attachment_url field)
                      const attachmentUrl = selectedIssueView?.attachment_url || selectedIssueView?.receipt_attachment;
                      
                      if (!attachmentUrl || !String(attachmentUrl).trim() || String(attachmentUrl).trim() === 'null') {
                        return <div style={{ padding: 20, textAlign: 'center', background: '#fff', borderRadius: 8, color: '#999', fontSize: 12 }}>No attachment</div>;
                      }
                      
                      const fileUrl = resolveFileUrl(attachmentUrl);
                      const isImage = fileUrl && isImageFile(fileUrl);
                      const errorKey = `issue_${selectedIssueView?.id}_gsps`;
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
                          key={`gsps_${selectedIssueView?.id}`}
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
                  <div>
                    <h5 style={{ margin: '0 0 8px', color: '#333', fontSize: 14 }}>Inspection Attachment</h5>
                    {(() => {
                      const inspectionUrl = selectedIssueView?.inspection_attachment;
                      
                      if (!inspectionUrl || !String(inspectionUrl).trim() || String(inspectionUrl).trim() === 'null') {
                        return <div style={{ padding: 20, textAlign: 'center', background: '#fff', borderRadius: 8, color: '#999', fontSize: 12 }}>No attachment</div>;
                      }
                      
                      const fileUrl = resolveFileUrl(inspectionUrl);
                      const isImage = fileUrl && isImageFile(fileUrl);
                      const errorKey = `issue_${selectedIssueView?.id}_inspection`;
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
                          key={`inspection_${selectedIssueView?.id}`}
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
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal.show && historyModal.subscription && (
        <HistoryModalWithTabs subscription={historyModal.subscription} onClose={() => setHistoryModal({ show: false, subscription: null })} />
      )}
    </div>
  );
}

// History Modal Component (same as GSPS)
function HistoryModalWithTabs({ subscription, onClose }) {
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

        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          <button onClick={() => { setActiveTab('subscription'); setSelectedIssueTab(null); }} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px 8px 0 0', background: activeTab === 'subscription' ? '#004A98' : '#e9ecef', color: activeTab === 'subscription' ? '#fff' : '#495057', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Subscription Flow</button>
          <button onClick={() => setActiveTab('issues')} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px 8px 0 0', background: activeTab === 'issues' ? '#004A98' : '#e9ecef', color: activeTab === 'issues' ? '#fff' : '#495057', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Serial Issues Flow</button>
        </div>

        {activeTab === 'subscription' && (
          <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <HistoryStep title="Created" description="Subscription created by TPU" done timestamp={subscription.created_at} />
              <HistoryStep title="Pending" description="Sent to supplier for acceptance" done timestamp={subscription.pending_at} />
              <HistoryStep title="Accepted" description="Accepted by supplier" done timestamp={subscription.accepted_at || subscription.issues?.[0]?.prepared_at || subscription.issues?.[0]?.for_delivery_at || subscription.issues?.[0]?.received_at || subscription.issues?.[0]?.inspected_at} />
              {subscription.aggregatedStatus === 'Delivered' && <HistoryStep title="Delivered" description="All issues delivered" done />}
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {issues.map((issue) => (
                <button key={issue.id} onClick={() => setSelectedIssueTab(issue)} style={{ padding: '8px 16px', border: selectedIssueTab?.id === issue.id ? '2px solid #004A98' : '1px solid #ddd', borderRadius: 6, background: selectedIssueTab?.id === issue.id ? '#E8F1FA' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: selectedIssueTab?.id === issue.id ? 600 : 400 }}>Issue #{issue.issue_number}</button>
              ))}
            </div>
            {selectedIssueTab ? (
              <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20 }}>
                <h4 style={{ margin: '0 0 16px', color: '#004A98' }}>Issue #{selectedIssueTab.issue_number} Timeline</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <HistoryStep title="Pending" description="Issue created" done timestamp={selectedIssueTab.created_at || selectedIssueTab.expected_delivery_date} />
                  {['prepare', 'for_delivery', 'received', 'delivered', 'for_return'].includes(selectedIssueTab.status) && <HistoryStep title="Preparing" description="Supplier preparing" done timestamp={selectedIssueTab.prepared_at || selectedIssueTab.for_delivery_at || selectedIssueTab.received_at || selectedIssueTab.inspected_at} />}
                  {['for_delivery', 'received', 'delivered', 'for_return'].includes(selectedIssueTab.status) && <HistoryStep title="For Delivery" description="Ready for delivery" done timestamp={selectedIssueTab.for_delivery_at || selectedIssueTab.received_at || selectedIssueTab.inspected_at} />}
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

export default function Dashboard_Inspection_Serialsforinspection() {
  return (
    <InspectionLayout title="Serials for Inspection">
      <SerialsForInspection />
    </InspectionLayout>
  );
}
