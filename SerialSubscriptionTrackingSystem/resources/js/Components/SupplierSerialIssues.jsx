import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import 'animate.css';
import { MdRefresh, MdFilterList, MdExpandMore, MdExpandLess, MdVisibility, MdBuild } from 'react-icons/md';
import { FiPackage, FiCheckCircle, FiTruck, FiClock, FiAlertTriangle } from 'react-icons/fi';

/**
 * SupplierSerialIssues - Component showing all serial issues for a supplier
 * Flow: pending → prepare → for_delivery → received → delivered/for_return
 * For return items: View (inspection results) and Prepare buttons
 */
const SupplierSerialIssues = ({ supplierName }) => {
  const [issues, setIssues] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedSubscriptions, setExpandedSubscriptions] = useState({});
  const [inspectionModal, setInspectionModal] = useState({ show: false, issue: null });

  useEffect(() => {
    if (supplierName) {
      fetchIssues();
    }
  }, [supplierName]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/serial-issues/supplier', {
        params: { supplier_name: supplierName }
      });
      if (response.data.success) {
        const fetchedIssues = response.data.issues || [];
        setIssues(fetchedIssues);
        
        // Group by subscription for accordion view
        const grouped = {};
        fetchedIssues.forEach(issue => {
          if (!grouped[issue.subscription_id]) {
            grouped[issue.subscription_id] = {
              serial_title: issue.serial_title,
              issues: []
            };
          }
          grouped[issue.subscription_id].issues.push(issue);
        });
        setSubscriptions(grouped);
        
        // Auto-expand all subscriptions
        const expanded = {};
        Object.keys(grouped).forEach(id => { expanded[id] = true; });
        setExpandedSubscriptions(expanded);
      }
    } catch (error) {
      console.error('Error fetching serial issues:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleStatusUpdate = async (subscriptionId, issueId, newStatus) => {
    setActionLoading(issueId);
    try {
      const response = await axios.put(`/api/subscriptions/${subscriptionId}/issues/${issueId}/status`, {
        status: newStatus,
      });
      if (response.data.success) {
        await fetchIssues();
        Swal.fire({
          title: 'Status Updated',
          text: `Issue status changed to ${getStatusLabel(newStatus)}`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update status',
        icon: 'error',
      });
    } finally {
      setActionLoading(null);
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

  const toggleSubscription = (subId) => {
    setExpandedSubscriptions(prev => ({
      ...prev,
      [subId]: !prev[subId]
    }));
  };

  // Get available action based on current status
  // Flow: pending → prepare → for_delivery
  const getAvailableAction = (issue) => {
    if (issue.status === 'pending') {
      return { label: 'Prepare', nextStatus: 'prepare', color: '#0c5460' };
    }
    if (issue.status === 'prepare') {
      return { label: 'For Delivery', nextStatus: 'for_delivery', color: '#6f42c1' };
    }
    // For return items can be re-prepared
    if (issue.status === 'for_return') {
      return { label: 'Prepare', nextStatus: 'prepare', color: '#0c5460', isReprepare: true };
    }
    return null;
  };

  // Format checklist items for display
  const formatChecklistItems = (checklist) => {
    if (!checklist || typeof checklist !== 'object') return [];
    
    const labels = {
      missingPages: 'Missing Pages',
      tornPages: 'Torn Pages',
      waterDamage: 'Water Damage',
      misprint: 'Misprint',
      other: 'Other Issues',
    };
    
    return Object.entries(checklist)
      .filter(([key, value]) => value === true)
      .map(([key]) => labels[key] || key);
  };

  // View inspection results modal
  const handleViewInspection = (issue) => {
    setInspectionModal({ show: true, issue });
  };

  // Filter issues
  const filteredSubscriptions = {};
  Object.keys(subscriptions).forEach(subId => {
    const sub = subscriptions[subId];
    const filteredIssues = sub.issues.filter(issue => {
      if (filter === 'all') return true;
      if (filter === 'pending') return issue.status === 'pending';
      if (filter === 'active') return ['prepare', 'for_delivery'].includes(issue.status);
      if (filter === 'completed') return ['received', 'delivered'].includes(issue.status);
      if (filter === 'for_return') return issue.status === 'for_return';
      return issue.status === filter;
    });
    if (filteredIssues.length > 0) {
      filteredSubscriptions[subId] = { ...sub, issues: filteredIssues };
    }
  });

  // Stats
  const pendingCount = issues.filter(i => i.status === 'pending').length;
  const activeCount = issues.filter(i => ['prepare', 'for_delivery'].includes(i.status)).length;
  const completedCount = issues.filter(i => ['received', 'delivered'].includes(i.status)).length;
  const forReturnCount = issues.filter(i => i.status === 'for_return').length;

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
        <p>No serial issues found.</p>
        <p style={{ fontSize: '14px', color: '#999' }}>Serial issues will appear here once you accept a subscription.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#E8F1FA', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <FiPackage size={22} color="#004A98" />
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#004A98', marginTop: '8px' }}>{issues.length}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Total Issues</div>
        </div>
        <div style={{ background: '#fff3cd', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <FiClock size={22} color="#856404" />
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#856404', marginTop: '8px' }}>{pendingCount}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Pending</div>
        </div>
        <div style={{ background: '#cce5ff', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <FiTruck size={22} color="#004085" />
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#004085', marginTop: '8px' }}>{activeCount}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>In Progress</div>
        </div>
        <div style={{ background: '#d4edda', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <FiCheckCircle size={22} color="#155724" />
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#155724', marginTop: '8px' }}>{completedCount}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Completed</div>
        </div>
        <div style={{ background: '#f8d7da', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <FiAlertTriangle size={22} color="#721c24" />
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#721c24', marginTop: '8px' }}>{forReturnCount}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>For Return</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'pending', 'active', 'completed', 'for_return'].map(f => (
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

      {/* Accordion by Subscription */}
      {Object.keys(filteredSubscriptions).length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          No issues match the selected filter.
        </div>
      ) : (
        Object.entries(filteredSubscriptions).map(([subId, sub]) => (
          <div key={subId} style={{ marginBottom: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Subscription Header */}
            <div 
              onClick={() => toggleSubscription(subId)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: '#f8f9fa',
                cursor: 'pointer',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: '#333', fontSize: '15px' }}>{sub.serial_title}</span>
                <span style={{ marginLeft: '12px', color: '#666', fontSize: '13px' }}>
                  ({sub.issues.length} issues)
                </span>
              </div>
              {expandedSubscriptions[subId] ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
            </div>

            {/* Issues Table */}
            {expandedSubscriptions[subId] && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>Issue #</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>Expected Delivery</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '13px' }}>Cost</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sub.issues.map((issue) => {
                      const statusColor = getStatusColor(issue.status);
                      const action = getAvailableAction(issue);
                      
                      return (
                        <tr key={issue.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>#{issue.issue_number}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{formatDate(issue.expected_delivery_date)}</td>
                          <td style={{ padding: '12px' }}>
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
                            {actionLoading === issue.id ? (
                              <span style={{ fontSize: '12px', color: '#666' }}>Loading...</span>
                            ) : issue.status === 'for_return' ? (
                              // For Return: Show View and Prepare buttons
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => handleViewInspection(issue)}
                                  style={{
                                    padding: '6px 12px',
                                    border: '1px solid #721c24',
                                    borderRadius: '4px',
                                    background: '#fff',
                                    color: '#721c24',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <MdVisibility size={14} /> View
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(issue.subscription_id, issue.id, 'prepare')}
                                  style={{
                                    padding: '6px 12px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    background: '#0c5460',
                                    color: '#fff',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <MdBuild size={14} /> Prepare
                                </button>
                              </div>
                            ) : action ? (
                              <button
                                onClick={() => handleStatusUpdate(issue.subscription_id, issue.id, action.nextStatus)}
                                style={{
                                  padding: '6px 14px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  background: action.color,
                                  color: '#fff',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                {action.label}
                              </button>
                            ) : (
                              <span style={{ color: '#999', fontSize: '12px' }}>
                                {issue.status === 'delivered' ? '✓ Delivered' : 
                                 issue.status === 'received' ? 'Awaiting Inspection' : '-'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}

      {/* Inspection Results Modal */}
      {inspectionModal.show && inspectionModal.issue && (
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
          onClick={() => setInspectionModal({ show: false, issue: null })}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '22px', color: '#721c24' }}>Inspection Results</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  {inspectionModal.issue.serial_title} - Issue #{inspectionModal.issue.issue_number}
                </p>
              </div>
              <button
                onClick={() => setInspectionModal({ show: false, issue: null })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  color: '#999',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Inspector Info */}
            <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Inspector:</span>
                <span style={{ fontWeight: 500, color: '#333' }}>{inspectionModal.issue.inspector_name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Inspection Date:</span>
                <span style={{ fontWeight: 500, color: '#333' }}>
                  {inspectionModal.issue.inspected_at 
                    ? formatDate(inspectionModal.issue.inspected_at)
                    : 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Condition:</span>
                <span style={{ fontWeight: 600, color: '#721c24' }}>{inspectionModal.issue.condition || 'For Return'}</span>
              </div>
            </div>

            {/* Issues Found (Checklist) */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '16px', color: '#333' }}>Issues Found</h4>
              {formatChecklistItems(inspectionModal.issue.inspection_checklist).length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {formatChecklistItems(inspectionModal.issue.inspection_checklist).map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        background: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '16px',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#999', fontSize: '14px' }}>No specific issues recorded.</p>
              )}
            </div>

            {/* Other Description */}
            {inspectionModal.issue.other_description && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '16px', color: '#333' }}>Other Description</h4>
                <p style={{ 
                  padding: '12px', 
                  background: '#fff3cd', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#856404',
                  margin: 0,
                }}>
                  {inspectionModal.issue.other_description}
                </p>
              </div>
            )}

            {/* Inspector Remarks */}
            {inspectionModal.issue.inspection_remarks && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '16px', color: '#333' }}>Inspector Remarks</h4>
                <p style={{ 
                  padding: '12px', 
                  background: '#f8f9fa', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  {inspectionModal.issue.inspection_remarks}
                </p>
              </div>
            )}

            {/* Inspection Attachment */}
            {inspectionModal.issue.inspection_attachment && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '16px', color: '#333' }}>Photo Evidence</h4>
                {inspectionModal.issue.inspection_attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={inspectionModal.issue.inspection_attachment}
                    alt="Inspection attachment"
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                    }}
                  />
                ) : (
                  <a
                    href={inspectionModal.issue.inspection_attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '10px 16px',
                      background: '#004A98',
                      color: '#fff',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '14px',
                    }}
                  >
                    View Attachment
                  </a>
                )}
              </div>
            )}

            {/* Close Button */}
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setInspectionModal({ show: false, issue: null })}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#004A98',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
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
};

export default SupplierSerialIssues;
