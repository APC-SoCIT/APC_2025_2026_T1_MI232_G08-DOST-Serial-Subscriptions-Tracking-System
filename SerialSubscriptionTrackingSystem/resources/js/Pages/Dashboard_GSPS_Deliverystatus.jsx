import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import GSPSLayout from '@/Layouts/GspsLayout';
import { MdSearch, MdFilterList, MdCloudUpload, MdClose, MdImage, MdVisibility, MdRefresh, MdExpandMore, MdExpandLess, MdCheckCircle } from "react-icons/md";
import { FiPackage, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";
import { FaHistory } from "react-icons/fa";
import Swal from 'sweetalert2';
import 'animate.css';
import ProcessMovementHistory from "@/Components/ProcessMovementHistory";

// GSPS Delivery Status Component - With clickable dropdown and serial issues
function DeliveryStatus() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // API data state
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({ total: 0, delivered: 0, ongoing: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Expanded row state for showing serial issues
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Confirm receipt modal
  const [confirmModal, setConfirmModal] = useState({ show: false, issue: null, subscription: null });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // View modal - shows compiled issues with attachments
  const [viewModal, setViewModal] = useState({ show: false, subscription: null });
  const [selectedIssueView, setSelectedIssueView] = useState(null);
  
  // History modal with tabs
  const [historyModal, setHistoryModal] = useState({ show: false, subscription: null });

  // Fetch delivery tracking data
  useEffect(() => {
    fetchDeliveryData();
  }, []);

  // Fetch delivery tracking data with loading state
  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/subscriptions/gsps-delivery-tracking');
      
      if (response.data.success) {
        setSubscriptions(response.data.subscriptions || []);
        setStats(response.data.stats || { total: 0, delivered: 0, ongoing: 0 });
      }
    } catch (err) {
      console.error('Error fetching delivery data:', err);
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

  // Toggle row expansion
  const handleToggleRow = (subscriptionId) => {
    setExpandedRow(expandedRow === subscriptionId ? null : subscriptionId);
  };

  // Issue status helpers
  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#fff3cd', text: '#856404' },
      prepare: { bg: '#d1ecf1', text: '#0c5460' },
      for_delivery: { bg: '#e2d4f0', text: '#6f42c1' },
      received: { bg: '#d4edda', text: '#155724' },
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

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
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

  // Handle file selection for confirm receipt
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({ title: 'Please select an image (JPG, PNG) or PDF file', icon: 'warning', confirmButtonColor: '#0062f4' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({ title: 'Maximum 10 MB file size', icon: 'warning', confirmButtonColor: '#0062f4' });
        e.target.value = '';
        return;
      }
      setAttachmentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseConfirmModal = () => {
    setConfirmModal({ show: false, issue: null, subscription: null });
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  // Handle confirm receipt with upload progress
  const handleConfirmReceipt = async () => {
    if (!confirmModal.issue || !confirmModal.subscription) return;
    
    if (!attachmentFile) {
      Swal.fire({ title: 'Please upload an image before confirming receipt.', icon: 'warning', confirmButtonColor: '#0062f4', zIndex: 10001 });
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('attachment', attachmentFile);
      
      const response = await axios.post(
        `/api/subscriptions/${confirmModal.subscription.subscription_id}/issues/${confirmModal.issue.id}/received`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      if (response.data.success) {
        await fetchDeliveryData();
        handleCloseConfirmModal();
        Swal.fire({
          title: 'Receipt Confirmed!',
          text: `Issue #${confirmModal.issue.issue_number} marked as received.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          zIndex: 10001,
        });
      } else {
        Swal.fire({ title: 'Failed to confirm receipt', icon: 'error', confirmButtonColor: '#0062f4', zIndex: 10001 });
      }
    } catch (err) {
      console.error('Error confirming receipt:', err);
      Swal.fire({ title: 'Failed to confirm receipt', icon: 'error', confirmButtonColor: '#0062f4', zIndex: 10001 });
    } finally {
      setUploading(false);
    }
  };

  // Get received issues for view modal
  const getReceivedIssues = (subscription) => {
    return (subscription.issues || []).filter(i => 
      ['received', 'delivered', 'for_return'].includes(i.status)
    );
  };

  // Stats cards data
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
          <div
            key={index}
            style={{
              background: stat.bgColor,
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${stat.color}`,
            }}
          >
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

      {/* Main Content Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: '#004A98', margin: '0 0 8px 0', fontSize: 20 }}>Delivery Tracking</h2>
            <p style={{ color: '#666', margin: 0, fontSize: 14 }}>Click serial title to view and manage issues</p>
          </div>
          <button
            onClick={fetchDeliveryData}
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
            <MdRefresh /> {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search serial title, supplier, or ISSN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14,
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: 6,
              border: '1px solid #ddd',
              fontSize: 14,
              background: '#fff',
              minWidth: 150,
            }}
          >
            <option value="All">All Status</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        {/* Delivery Tracking Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #004A98, #0062f4)', color: '#fff' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Serial Title</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Supplier</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Issues</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    Loading delivery data...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
                    {error}
                    <button onClick={fetchDeliveryData} style={{ marginLeft: 16, padding: '8px 16px', background: '#004A98', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredSubscriptions.length > 0 ? (
                filteredSubscriptions.map((sub, index) => {
                  const isExpanded = expandedRow === sub.id;
                  
                  return (
                    <React.Fragment key={sub.id}>
                      <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #eee', background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                        <td
                          style={{ padding: '16px', cursor: 'pointer', color: '#004A98' }}
                          onClick={() => handleToggleRow(sub.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', background: '#E8F1FA', borderRadius: 4 }}>
                              {isExpanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                            </span>
                            <span style={{ fontWeight: 600 }}>{sub.serialTitle}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>{sub.supplierName}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#004A98' }}>{sub.deliveredIssues}</span>
                          <span style={{ color: '#666' }}> / {sub.totalIssues}</span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '6px 16px',
                            borderRadius: 20,
                            background: sub.aggregatedStatus === 'Delivered' ? '#d4edda' : '#fff3cd',
                            color: sub.aggregatedStatus === 'Delivered' ? '#155724' : '#856404',
                            fontSize: 12,
                            fontWeight: 500,
                          }}>
                            {sub.aggregatedStatus}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              onClick={() => { setViewModal({ show: true, subscription: sub }); setSelectedIssueView(null); }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: '1px solid #17a2b8',
                                background: '#f8f9fa',
                                color: '#17a2b8',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 500,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <MdVisibility size={14} /> View
                            </button>
                            <button
                              onClick={() => setHistoryModal({ show: true, subscription: sub })}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid #004A98',
                                background: '#f8f9fa',
                                color: '#004A98',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 500,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <FaHistory size={10} /> History
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Serial Issues Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="5" style={{ padding: 0 }}>
                            <div style={{ background: '#f8f9fa', padding: '16px 24px', borderBottom: '2px solid #004A98' }}>
                              <h4 style={{ margin: '0 0 12px', color: '#004A98', fontSize: 14, fontWeight: 600 }}>
                                Serial Issues for {sub.serialTitle}
                              </h4>
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8 }}>
                                  <thead>
                                    <tr style={{ background: '#e9ecef' }}>
                                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>Issue</th>
                                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Supplier</th>
                                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Expected Delivery</th>
                                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>Status</th>
                                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontSize: 12 }}>Cost</th>
                                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(sub.issues || []).map((issue) => {
                                      const statusColor = getStatusColor(issue.status);
                                      return (
                                        <tr key={issue.id} style={{ borderBottom: '1px solid #eee' }}>
                                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#004A98' }}>
                                            #{issue.issue_number}
                                          </td>
                                          <td style={{ padding: '10px 12px', fontSize: 13 }}>{sub.supplierName}</td>
                                          <td style={{ padding: '10px 12px', fontSize: 13 }}>{formatDate(issue.expected_delivery_date)}</td>
                                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                            <span style={{
                                              padding: '4px 10px',
                                              borderRadius: 20,
                                              background: statusColor.bg,
                                              color: statusColor.text,
                                              fontSize: 11,
                                              fontWeight: 500,
                                            }}>
                                              {getStatusLabel(issue.status)}
                                            </span>
                                          </td>
                                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#004A98', fontSize: 13 }}>
                                            {formatCurrency(issue.cost)}
                                          </td>
                                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                            {issue.status === 'for_delivery' ? (
                                              <button
                                                onClick={() => setConfirmModal({ show: true, issue, subscription: sub })}
                                                style={{
                                                  padding: '6px 12px',
                                                  border: 'none',
                                                  borderRadius: 4,
                                                  background: '#28a745',
                                                  color: '#fff',
                                                  fontSize: 11,
                                                  cursor: 'pointer',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: 4,
                                                }}
                                              >
                                                <MdCheckCircle size={14} /> Confirm Receipt
                                              </button>
                                            ) : (
                                              <span style={{ color: '#999', fontSize: 11 }}>
                                                {issue.status === 'received' ? 'Awaiting Inspection' : 
                                                 issue.status === 'delivered' ? '✓ Delivered' : 
                                                 issue.status === 'for_return' ? '⚠ For Return' : '-'}
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    {searchTerm || statusFilter !== 'All' ? 'No subscriptions match your search/filter.' : 'No subscriptions with serial issues yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, color: '#666', fontSize: 14 }}>
          <div>Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions</div>
        </div>
      </div>

      {/* Confirm Receipt Modal */}
      {confirmModal.show && confirmModal.issue && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={handleCloseConfirmModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '32px',
              maxWidth: 500,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', color: '#004A98' }}>Confirm Receipt</h3>
            <p style={{ color: '#666', marginBottom: 24 }}>
              {confirmModal.subscription?.serialTitle} - Issue #{confirmModal.issue?.issue_number}
            </p>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Upload Attachment <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                style={{ display: 'none' }}
              />
              {attachmentPreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {attachmentFile?.type?.includes('image') ? (
                    <img src={attachmentPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #ddd' }} />
                  ) : (
                    <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: 8, border: '1px solid #ddd' }}>
                      {attachmentFile?.name}
                    </div>
                  )}
                  <button
                    onClick={handleRemoveAttachment}
                    style={{ position: 'absolute', top: -8, right: -8, background: '#dc3545', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <MdClose size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '40px 20px',
                    border: '2px dashed #ddd',
                    borderRadius: 8,
                    background: '#f8f9fa',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <MdCloudUpload size={32} color="#666" />
                  <span style={{ color: '#666' }}>Click to upload image or PDF (Max 10MB)</span>
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={handleCloseConfirmModal}
                style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReceipt}
                disabled={uploading || !attachmentFile}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: 6,
                  background: !attachmentFile ? '#ccc' : '#28a745',
                  color: '#fff',
                  cursor: !attachmentFile || uploading ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? 'Uploading...' : 'Confirm Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal - Compilation of Issues */}
      {viewModal.show && viewModal.subscription && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setViewModal({ show: false, subscription: null })}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '32px',
              maxWidth: 700,
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', color: '#004A98' }}>Serial Issues Compilation</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{viewModal.subscription.serialTitle}</p>
              </div>
              <button
                onClick={() => setViewModal({ show: false, subscription: null })}
                style={{ background: 'transparent', border: 'none', fontSize: 24, color: '#999', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Issue Selection List */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#333' }}>Received Issues ({getReceivedIssues(viewModal.subscription).length})</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {getReceivedIssues(viewModal.subscription).length === 0 ? (
                  <p style={{ color: '#888', fontSize: 14 }}>No issues received yet.</p>
                ) : (
                  getReceivedIssues(viewModal.subscription).map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedIssueView(issue)}
                      style={{
                        padding: '8px 16px',
                        border: selectedIssueView?.id === issue.id ? '2px solid #004A98' : '1px solid #ddd',
                        borderRadius: 6,
                        background: selectedIssueView?.id === issue.id ? '#E8F1FA' : '#fff',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: selectedIssueView?.id === issue.id ? 600 : 400,
                      }}
                    >
                      Issue #{issue.issue_number}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Selected Issue Details */}
            {selectedIssueView && (
              <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20 }}>
                <h4 style={{ margin: '0 0 16px', color: '#004A98' }}>Issue #{selectedIssueView.issue_number} Details</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 16 }}>
                  <div><span style={{ color: '#666' }}>Expected Delivery:</span> <strong>{formatDate(selectedIssueView.expected_delivery_date)}</strong></div>
                  <div><span style={{ color: '#666' }}>Received Date:</span> <strong>{formatDate(selectedIssueView.received_at)}</strong></div>
                  <div><span style={{ color: '#666' }}>Cost:</span> <strong>{formatCurrency(selectedIssueView.cost)}</strong></div>
                  <div>
                    <span style={{ color: '#666' }}>Status:</span>{' '}
                    <span style={{ padding: '4px 10px', borderRadius: 20, background: getStatusColor(selectedIssueView.status).bg, color: getStatusColor(selectedIssueView.status).text, fontSize: 12, fontWeight: 500 }}>
                      {getStatusLabel(selectedIssueView.status)}
                    </span>
                  </div>
                </div>
                
                {/* GSPS can view receipt attachment only */}
                <div>
                  <h5 style={{ margin: '0 0 8px', color: '#333', fontSize: 14 }}>Receipt Attachment</h5>
                  {(() => {
                    const fileUrl = resolveFileUrl(selectedIssueView.attachment_url || selectedIssueView.receipt_attachment);
                    const isImage = fileUrl && isImageFile(fileUrl);
                    
                    if (!fileUrl) {
                      return <div style={{ padding: 20, textAlign: 'center', background: '#fff', borderRadius: 8, color: '#999', fontSize: 12 }}>No receipt attachment</div>;
                    }
                    
                    return isImage ? (
                      <img 
                        src={fileUrl} 
                        alt="GSPS Attachment" 
                        loading="lazy"
                        style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#f0f0f0' }} 
                        onClick={() => window.open(fileUrl, '_blank')}
                      />
                    ) : (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 16px', background: '#004A98', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}>
                        Open Document
                      </a>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Modal with Tabs */}
      {historyModal.show && historyModal.subscription && (
        <HistoryModalWithTabs
          subscription={historyModal.subscription}
          onClose={() => setHistoryModal({ show: false, subscription: null })}
        />
      )}
    </div>
  );
}

// History Modal with Tabs Component
function HistoryModalWithTabs({ subscription, onClose }) {
  const [activeTab, setActiveTab] = useState('subscription');
  const [selectedIssueTab, setSelectedIssueTab] = useState(null);

  const issues = subscription.issues || [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '32px',
          maxWidth: 800,
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', color: '#004A98' }}>History</h3>
            <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{subscription.serialTitle}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 24, color: '#999', cursor: 'pointer' }}>×</button>
        </div>

        {/* Main Tabs: Subscription / Serial Issues */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          <button
            onClick={() => { setActiveTab('subscription'); setSelectedIssueTab(null); }}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              background: activeTab === 'subscription' ? '#004A98' : '#e9ecef',
              color: activeTab === 'subscription' ? '#fff' : '#495057',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Subscription Flow
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              background: activeTab === 'issues' ? '#004A98' : '#e9ecef',
              color: activeTab === 'issues' ? '#fff' : '#495057',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Serial Issues Flow
          </button>
        </div>

        {/* Subscription Flow Tab */}
        {activeTab === 'subscription' && (
          <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <HistoryStep title="Created" description="Subscription created by TPU" done timestamp={subscription.created_at} />
              <HistoryStep title="Pending" description="Sent to supplier for acceptance" done timestamp={subscription.pending_at} />
              <HistoryStep title="Accepted" description="Accepted by supplier" done timestamp={subscription.accepted_at || subscription.issues?.[0]?.prepared_at || subscription.issues?.[0]?.for_delivery_at || subscription.issues?.[0]?.received_at || subscription.issues?.[0]?.inspected_at} />
              {subscription.aggregatedStatus === 'Delivered' && (
                <HistoryStep title="Delivered" description="All issues delivered" done />
              )}
            </div>
          </div>
        )}

        {/* Serial Issues Flow Tab */}
        {activeTab === 'issues' && (
          <div>
            {/* Issue Selection Sub-tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {issues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssueTab(issue)}
                  style={{
                    padding: '8px 16px',
                    border: selectedIssueTab?.id === issue.id ? '2px solid #004A98' : '1px solid #ddd',
                    borderRadius: 6,
                    background: selectedIssueTab?.id === issue.id ? '#E8F1FA' : '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: selectedIssueTab?.id === issue.id ? 600 : 400,
                  }}
                >
                  Issue #{issue.issue_number}
                </button>
              ))}
            </div>

            {/* Selected Issue History */}
            {selectedIssueTab ? (
              <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20 }}>
                <h4 style={{ margin: '0 0 16px', color: '#004A98' }}>Issue #{selectedIssueTab.issue_number} Timeline</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <HistoryStep title="Pending" description="Issue created, awaiting preparation" done timestamp={selectedIssueTab.created_at || selectedIssueTab.expected_delivery_date} />
                  {['prepare', 'for_delivery', 'received', 'delivered', 'for_return'].includes(selectedIssueTab.status) && (
                    <HistoryStep title="Preparing" description="Supplier is preparing the issue" done timestamp={selectedIssueTab.prepared_at || selectedIssueTab.for_delivery_at || selectedIssueTab.received_at || selectedIssueTab.inspected_at} />
                  )}
                  {['for_delivery', 'received', 'delivered', 'for_return'].includes(selectedIssueTab.status) && (
                    <HistoryStep title="For Delivery" description="Issue ready for delivery" done timestamp={selectedIssueTab.for_delivery_at || selectedIssueTab.received_at || selectedIssueTab.inspected_at} />
                  )}
                  {['received', 'delivered', 'for_return'].includes(selectedIssueTab.status) && (
                    <HistoryStep title="Received" description="Received by GSPS" done timestamp={selectedIssueTab.received_at} />
                  )}
                  {selectedIssueTab.status === 'delivered' && (
                    <HistoryStep title="Delivered" description="Inspected and delivered successfully" done timestamp={selectedIssueTab.inspected_at} />
                  )}
                  {selectedIssueTab.status === 'for_return' && (
                    <HistoryStep title="For Return" description="Marked for return by inspection" done isReturn timestamp={selectedIssueTab.inspected_at} />
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#666', background: '#f8f9fa', borderRadius: 12 }}>
                Select an issue above to view its timeline
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format datetime with time
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
      <div style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: done ? (isReturn ? '#dc3545' : '#28a745') : '#e9ecef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
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

// Main Component
export default function Dashboard_GSPS_Deliverystatus() {
  return (
    <GSPSLayout title="Delivery Status">
      <DeliveryStatus />
    </GSPSLayout>
  );
}
