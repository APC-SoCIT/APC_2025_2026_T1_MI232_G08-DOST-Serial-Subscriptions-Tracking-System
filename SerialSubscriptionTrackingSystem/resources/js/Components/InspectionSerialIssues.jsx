import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { usePage } from "@inertiajs/react";
import Swal from 'sweetalert2';
import 'animate.css';
import { MdRefresh, MdCloudUpload, MdClose, MdImage, MdCheckCircle, MdError } from 'react-icons/md';
import { FiPackage, FiCheckCircle, FiClock, FiAlertTriangle, FiEye } from 'react-icons/fi';

/**
 * InspectionSerialIssues - Component showing all serial issues for Inspection
 */
const InspectionSerialIssues = () => {
  const { auth } = usePage().props;
  const user = auth?.user;

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [inspectModal, setInspectModal] = useState({ show: false, issue: null });
  const [condition, setCondition] = useState('Acceptable');
  const [remark, setRemark] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checklist, setChecklist] = useState({
    missingPages: false,
    tornPages: false,
    waterDamage: false,
    misprint: false,
    other: false,
  });
  const [otherDescription, setOtherDescription] = useState('');
  const fileInputRef = useRef(null);

  const checklistLabels = {
    missingPages: "Missing Pages",
    tornPages: "Torn Pages",
    waterDamage: "Water Damage",
    misprint: "Misprint",
    other: "Others",
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/serial-issues/for-inspection');
      if (response.data.success) {
        setIssues(response.data.issues || []);
      }
    } catch (error) {
      console.error('Error fetching serial issues for inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (inspectionStatus) => {
    const colors = {
      pending: { bg: '#fff3cd', text: '#856404' },
      inspected: { bg: '#d4edda', text: '#155724' },
      for_return: { bg: '#f8d7da', text: '#721c24' },
    };
    return colors[inspectionStatus] || { bg: '#e2e3e5', text: '#383d41' };
  };

  const getStatusLabel = (inspectionStatus) => {
    const labels = {
      pending: 'Pending',
      inspected: 'Inspected',
      for_return: 'For Return',
    };
    return labels[inspectionStatus] || 'Pending';
  };

  const handleOpenInspectModal = (issue) => {
    setInspectModal({ show: true, issue });
    setCondition('Acceptable');
    setRemark('');
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setChecklist({
      missingPages: false,
      tornPages: false,
      waterDamage: false,
      misprint: false,
      other: false,
    });
    setOtherDescription('');
  };

  const handleCloseInspectModal = () => {
    setInspectModal({ show: false, issue: null });
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

  const handleToggleChecklist = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmitInspection = async () => {
    if (!inspectModal.issue) return;

    // If "For Return", require at least one issue checked
    if (condition === 'For Return') {
      const hasAnyChecked = Object.values(checklist).some(v => v);
      if (!hasAnyChecked) {
        Swal.fire({ 
          title: 'Issue Required', 
          text: 'Please select at least one issue for items marked For Return.', 
          icon: 'warning', 
          confirmButtonColor: '#0062f4' 
        });
        return;
      }
      if (checklist.other && !otherDescription.trim()) {
        Swal.fire({ 
          title: 'Description Required', 
          text: 'Please describe the other issue.', 
          icon: 'warning', 
          confirmButtonColor: '#0062f4' 
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('inspection_status', condition === 'Acceptable' ? 'inspected' : 'for_return');
      formData.append('inspector_name', user?.name || 'Inspector');
      formData.append('condition', condition);
      formData.append('remark', remark);
      formData.append('checklist', JSON.stringify(checklist));
      formData.append('other_description', otherDescription);
      
      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }

      // Use the correct endpoint: /api/subscriptions/{subscriptionId}/issues/{issueId}/inspection
      const response = await axios.post(
        `/api/subscriptions/${inspectModal.issue.subscription_id}/issues/${inspectModal.issue.id}/inspection`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        await fetchIssues();
        handleCloseInspectModal();
        Swal.fire({
          title: 'Inspection Submitted!',
          text: `Serial issue marked as ${condition === 'Acceptable' ? 'Inspected' : 'For Return'}.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      Swal.fire({ title: 'Error', text: 'Failed to submit inspection. Please try again.', icon: 'error', confirmButtonColor: '#0062f4' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !issue.inspection_status || issue.inspection_status === 'pending';
    if (filter === 'inspected') return issue.inspection_status === 'inspected';
    if (filter === 'for_return') return issue.inspection_status === 'for_return';
    return true;
  });

  // Stats
  const pendingCount = issues.filter(i => !i.inspection_status || i.inspection_status === 'pending').length;
  const inspectedCount = issues.filter(i => i.inspection_status === 'inspected').length;
  const forReturnCount = issues.filter(i => i.inspection_status === 'for_return').length;

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
        Loading serial issues for inspection...
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <FiPackage size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>No serial issues awaiting inspection.</p>
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
        <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <FiClock size={24} color="#856404" />
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#856404', marginTop: '8px' }}>{pendingCount}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>Pending</div>
        </div>
        <div style={{ background: '#d4edda', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <FiCheckCircle size={24} color="#155724" />
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#155724', marginTop: '8px' }}>{inspectedCount}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>Inspected</div>
        </div>
        <div style={{ background: '#f8d7da', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <FiAlertTriangle size={24} color="#721c24" />
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#721c24', marginTop: '8px' }}>{forReturnCount}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>For Return</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'pending', 'inspected', 'for_return'].map(f => (
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
              {f === 'all' ? 'All' : f === 'for_return' ? 'For Return' : f.charAt(0).toUpperCase() + f.slice(1)}
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
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>Received Date</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  No issues match the selected filter.
                </td>
              </tr>
            ) : (
              filteredIssues.map((issue) => {
                const statusColor = getStatusColor(issue.inspection_status);
                const isPending = !issue.inspection_status || issue.inspection_status === 'pending';
                return (
                  <tr key={issue.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{issue.serial_title || 'N/A'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>#{issue.issue_number}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{issue.supplier_name || 'N/A'}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{formatDate(issue.received_at)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: statusColor.bg,
                        color: statusColor.text,
                        fontSize: 12,
                        fontWeight: 500,
                      }}>
                        {getStatusLabel(issue.inspection_status)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {isPending ? (
                        <button
                          onClick={() => handleOpenInspectModal(issue)}
                          style={{
                            padding: '6px 14px',
                            border: 'none',
                            borderRadius: '4px',
                            background: '#004A98',
                            color: '#fff',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Inspect
                        </button>
                      ) : (
                        <span style={{ 
                          color: issue.inspection_status === 'inspected' ? '#28a745' : '#dc3545', 
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4
                        }}>
                          {issue.inspection_status === 'inspected' ? (
                            <><MdCheckCircle /> Inspected</>
                          ) : (
                            <><MdError /> For Return</>
                          )}
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

      {/* Inspection Modal */}
      {inspectModal.show && inspectModal.issue && (
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
            overflowY: 'auto',
            padding: '20px',
          }}
          onClick={handleCloseInspectModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              maxWidth: 500,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#004A98' }}>Inspection Form</h3>
            <p style={{ margin: '0 0 24px', color: '#666', fontSize: 14 }}>
              {inspectModal.issue.serial_title} - Issue #{inspectModal.issue.issue_number}
            </p>

            {/* Inspector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Inspector</label>
              <input
                type="text"
                value={user?.name || 'Inspector'}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  background: '#f5f5f5',
                  fontSize: 14,
                }}
              />
            </div>

            {/* Condition */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Condition</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {['Acceptable', 'For Return'].map(opt => (
                  <label 
                    key={opt}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      cursor: 'pointer',
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: condition === opt ? '2px solid #004A98' : '1px solid #ddd',
                      background: condition === opt ? '#E8F1FA' : '#fff',
                    }}
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={opt}
                      checked={condition === opt}
                      onChange={() => setCondition(opt)}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: 14, color: condition === opt ? '#004A98' : '#333' }}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Checklist (For Return only) */}
            {condition === 'For Return' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Issues Found</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(checklistLabels).map(([key, label]) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: checklist[key] ? '2px solid #dc3545' : '1px solid #ddd',
                        background: checklist[key] ? '#f8d7da' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checklist[key]}
                        onChange={() => handleToggleChecklist(key)}
                      />
                      <span style={{ fontSize: 13 }}>{label}</span>
                    </label>
                  ))}
                </div>
                {checklist.other && (
                  <textarea
                    placeholder="Describe other issue..."
                    value={otherDescription}
                    onChange={(e) => setOtherDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 14,
                      marginTop: 12,
                      minHeight: 60,
                      resize: 'vertical',
                    }}
                  />
                )}
              </div>
            )}

            {/* Remarks */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Remarks (Optional)</label>
              <textarea
                placeholder="Add any remarks..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 14,
                  minHeight: 80,
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Attachment */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                Photo Evidence {condition === 'For Return' ? '(Recommended)' : '(Optional)'}
              </label>
              <div
                style={{
                  border: '2px dashed #ccc',
                  borderRadius: 8,
                  padding: 20,
                  textAlign: 'center',
                  background: '#f9f9f9',
                  cursor: 'pointer',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {attachmentPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {typeof attachmentPreview === 'string' && attachmentPreview.startsWith('data:image') ? (
                      <img src={attachmentPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 8 }} />
                    ) : (
                      <div style={{ padding: 12, background: '#e9ecef', borderRadius: 8 }}>
                        <MdImage size={28} color="#666" />
                        <p style={{ margin: '4px 0 0', fontSize: 11 }}>{attachmentFile?.name}</p>
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
                        width: 22,
                        height: 22,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MdClose size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <MdCloudUpload size={32} color="#666" />
                    <p style={{ margin: '6px 0 0', color: '#666', fontSize: 13 }}>
                      Click to upload
                    </p>
                    <p style={{ margin: '2px 0 0', color: '#999', fontSize: 11 }}>
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
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={handleSubmitInspection}
                disabled={submitting}
                style={{
                  padding: '10px 32px',
                  borderRadius: 6,
                  border: 'none',
                  background: submitting ? '#ccc' : condition === 'Acceptable' ? '#28a745' : '#dc3545',
                  color: '#fff',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {submitting ? 'Submitting...' : `Mark as ${condition === 'Acceptable' ? 'Inspected' : 'For Return'}`}
              </button>
              <button
                onClick={handleCloseInspectModal}
                disabled={submitting}
                style={{
                  padding: '10px 32px',
                  borderRadius: 6,
                  border: '1px solid #6c757d',
                  background: '#fff',
                  color: '#6c757d',
                  cursor: submitting ? 'not-allowed' : 'pointer',
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

export default InspectionSerialIssues;
