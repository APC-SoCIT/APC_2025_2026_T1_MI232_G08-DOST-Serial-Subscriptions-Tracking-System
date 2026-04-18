import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'animate.css';
import { MdRefresh, MdCloudUpload, MdClose, MdImage, MdCheckCircle } from 'react-icons/md';
import { FiPackage, FiCheckCircle, FiClock, FiTruck } from 'react-icons/fi';

/**
 * GSPSSerialIssues - Component showing all serial issues for GSPS to receive and confirm
 */
const GSPSSerialIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [confirmModal, setConfirmModal] = useState({ show: false, issue: null });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      // Fetch all serial issues - GSPS receives serials that are for_delivery
      const response = await axios.get('/api/serial-issues', {
        params: { include_subscription: true }
      });
      if (response.data.success) {
        // Filter to show only issues that are for_delivery or received
        const relevantIssues = (response.data.issues || []).filter(issue =>
          ['for_delivery', 'received', 'delivered', 'for_return'].includes(issue.status)
        );
        setIssues(relevantIssues);
      }
    } catch (error) {
      console.error('Error fetching serial issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      for_delivery: { bg: '#e2d4f0', text: '#6f42c1' },
      received: { bg: '#cce5ff', text: '#004085' },
      delivered: { bg: '#d4edda', text: '#155724' },
      for_return: { bg: '#f8d7da', text: '#721c24' },
    };
    return colors[status] || { bg: '#e2e3e5', text: '#383d41' };
  };

  const getStatusLabel = (status) => {
    const labels = {
      for_delivery: 'For Delivery',
      received: 'Received',
      delivered: 'Delivered',
      for_return: 'For Return',
    };
    return labels[status] || status;
  };

  const handleOpenConfirmModal = (issue) => {
    setConfirmModal({ show: true, issue });
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  const handleCloseConfirmModal = () => {
    setConfirmModal({ show: false, issue: null });
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({ title: 'Invalid Format', text: 'Please select an image (JPG, PNG) or PDF file', icon: 'warning', confirmButtonColor: '#0062f4' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({ title: 'Maximum of 10 MB', text: 'Please try again with a smaller file.', icon: 'warning', confirmButtonColor: '#0062f4' });
        e.target.value = '';
        return;
      }
      setAttachmentFile(file);
      if (file.type !== 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = () => setAttachmentPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(file.name);
      }
    }
  };

  const handleConfirmReceipt = async () => {
    if (!confirmModal.issue) return;
    
    if (!attachmentFile) {
      Swal.fire({ title: 'Attachment Required', text: 'Please upload an image of the received serial before confirming.', icon: 'warning', confirmButtonColor: '#0062f4' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('attachment', attachmentFile);
      formData.append('notes', `Received on ${new Date().toLocaleString()}`);
      
      // Use the correct endpoint: /api/subscriptions/{subscriptionId}/issues/{issueId}/received
      const response = await axios.post(
        `/api/subscriptions/${confirmModal.issue.subscription_id}/issues/${confirmModal.issue.id}/received`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        await fetchIssues();
        handleCloseConfirmModal();
        Swal.fire({
          title: 'Received!',
          text: 'Serial issue has been marked as received.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error confirming receipt:', error);
      Swal.fire({ title: 'Error', text: 'Failed to confirm receipt. Please try again.', icon: 'error', confirmButtonColor: '#0062f4' });
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return true;
    if (filter === 'for_delivery') return issue.status === 'for_delivery';
    if (filter === 'received') return ['received', 'delivered', 'for_return'].includes(issue.status);
    return issue.status === filter;
  });

  // Stats
  const forDeliveryCount = issues.filter(i => i.status === 'for_delivery').length;
  const receivedCount = issues.filter(i => i.status === 'received').length;
  const completedCount = issues.filter(i => ['delivered', 'for_return'].includes(i.status)).length;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #004A98',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        Loading serial issues...
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <FiPackage size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>No serial issues awaiting delivery.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#E8F1FA', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <FiPackage size={24} color="#004A98" />
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#004A98', marginTop: '8px' }}>{issues.length}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>Total Issues</div>
        </div>
        <div style={{ background: '#e2d4f0', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <FiTruck size={24} color="#6f42c1" />
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#6f42c1', marginTop: '8px' }}>{forDeliveryCount}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>For Delivery</div>
        </div>
        <div style={{ background: '#cce5ff', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <FiClock size={24} color="#004085" />
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#004085', marginTop: '8px' }}>{receivedCount}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>Received</div>
        </div>
        <div style={{ background: '#d4edda', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <FiCheckCircle size={24} color="#155724" />
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#155724', marginTop: '8px' }}>{completedCount}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>Completed</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'for_delivery', 'received'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '20px',
                background: filter === f ? '#004A98' : '#f0f0f0',
                color: filter === f ? '#fff' : '#333',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {f === 'all' ? 'All' : f === 'for_delivery' ? 'For Delivery' : 'Received'}
            </button>
          ))}
        </div>
        <button
          onClick={fetchIssues}
          style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            background: '#fff',
            color: '#666',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <MdRefresh /> Refresh
        </button>
      </div>

      {/* Issues Table */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>Serial Title</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Issue #</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>Supplier</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>Expected Delivery</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '13px' }}>Cost</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  No issues match the selected filter.
                </td>
              </tr>
            ) : (
              filteredIssues.map((issue) => {
                const statusColor = getStatusColor(issue.status);
                return (
                  <tr key={issue.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{issue.serial_title || 'N/A'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>#{issue.issue_number}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{issue.supplier_name || 'N/A'}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{formatDate(issue.expected_delivery_date)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: statusColor.bg,
                        color: statusColor.text,
                        fontSize: 12,
                        fontWeight: 500,
                      }}>
                        {getStatusLabel(issue.status)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#004A98' }}>
                      {formatCurrency(issue.cost)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {issue.status === 'for_delivery' ? (
                        <button
                          onClick={() => handleOpenConfirmModal(issue)}
                          style={{
                            padding: '6px 14px',
                            border: 'none',
                            borderRadius: '4px',
                            background: '#28a745',
                            color: '#fff',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Confirm Receipt
                        </button>
                      ) : (
                        <span style={{ color: '#28a745', fontSize: '13px' }}>
                          <MdCheckCircle style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          {issue.status === 'delivered' ? 'Delivered' : issue.status === 'for_return' ? 'For Return' : 'Received'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
            background: 'rgba(0, 0, 0, 0.5)',
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
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              maxWidth: 450,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#222' }}>Confirm Receipt</h3>
            <p style={{ margin: '0 0 24px', color: '#666', fontSize: 14 }}>
              {confirmModal.issue.serial_title} - Issue #{confirmModal.issue.issue_number}
            </p>

            {/* File Upload Area */}
            <div
              style={{
                border: '2px dashed #ccc',
                borderRadius: 8,
                padding: 24,
                textAlign: 'center',
                background: '#f9f9f9',
                marginBottom: 24,
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {attachmentPreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {typeof attachmentPreview === 'string' && attachmentPreview.startsWith('data:image') ? (
                    <img src={attachmentPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }} />
                  ) : (
                    <div style={{ padding: 16, background: '#e9ecef', borderRadius: 8 }}>
                      <MdImage size={32} color="#666" />
                      <p style={{ margin: '8px 0 0', fontSize: 12 }}>{attachmentFile?.name}</p>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttachmentFile(null);
                      setAttachmentPreview(null);
                    }}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MdClose size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <MdCloudUpload size={40} color="#666" />
                  <p style={{ margin: '8px 0 0', color: '#666', fontSize: 14 }}>
                    Click to upload receipt image
                  </p>
                  <p style={{ margin: '4px 0 0', color: '#999', fontSize: 12 }}>
                    JPG, PNG or PDF (max 10MB)
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={handleConfirmReceipt}
                disabled={uploading || !attachmentFile}
                style={{
                  padding: '10px 32px',
                  borderRadius: 6,
                  border: 'none',
                  background: uploading || !attachmentFile ? '#ccc' : '#28a745',
                  color: '#fff',
                  cursor: uploading || !attachmentFile ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {uploading ? 'Confirming...' : 'Confirm'}
              </button>
              <button
                onClick={handleCloseConfirmModal}
                disabled={uploading}
                style={{
                  padding: '10px 32px',
                  borderRadius: 6,
                  border: '1px solid #dc3545',
                  background: '#fff',
                  color: '#dc3545',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSPSSerialIssues;
