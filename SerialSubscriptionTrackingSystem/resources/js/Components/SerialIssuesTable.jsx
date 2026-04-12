import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdRefresh, MdEdit, MdCheck, MdClose, MdLocalShipping, MdAssignment, MdWarning } from 'react-icons/md';
import { FiPackage, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import Swal from 'sweetalert2';

/**
 * SerialIssuesTable - Displays and manages serial issues for a subscription
 * 
 * @param {string} subscriptionId - The ID of the subscription
 * @param {string} userRole - The role of the current user (tpu, supplier, gsps, inspection)
 * @param {function} onCostUpdate - Callback when costs are updated
 */
const SerialIssuesTable = ({ subscriptionId, userRole = 'tpu', onCostUpdate }) => {
  const [issues, setIssues] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');
  const [editingNotes, setEditingNotes] = useState(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (subscriptionId) {
      fetchIssues();
    }
  }, [subscriptionId]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/subscriptions/${subscriptionId}/issues`);
      if (response.data.success) {
        setIssues(response.data.issues || []);
        setSummary(response.data.summary || {});
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
      accepted: { bg: '#cce5ff', text: '#004085' },
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
      accepted: 'Accepted',
      prepare: 'Preparing',
      for_delivery: 'For Delivery',
      received: 'Received',
      delivered: 'Delivered',
      for_return: 'For Return',
    };
    return labels[status] || status;
  };

  const getInspectionStatusColor = (status) => {
    const colors = {
      inspected: { bg: '#d4edda', text: '#155724' },
      for_return: { bg: '#f8d7da', text: '#721c24' },
    };
    return colors[status] || { bg: '#e2e3e5', text: '#383d41' };
  };

  const getInspectionStatusLabel = (status) => {
    if (!status) return 'Pending';
    const labels = {
      inspected: 'Inspected',
      for_return: 'For Return',
    };
    return labels[status] || status;
  };

  // Status update handlers based on role
  const handleStatusUpdate = async (issueId, newStatus) => {
    setActionLoading(issueId);
    try {
      const response = await axios.put(`/api/subscriptions/${subscriptionId}/issues/${issueId}/status`, {
        status: newStatus,
      });
      if (response.data.success) {
        await fetchIssues();
        if (onCostUpdate) onCostUpdate();
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

  const handleMarkReceived = async (issueId) => {
    setActionLoading(issueId);
    try {
      const response = await axios.post(`/api/subscriptions/${subscriptionId}/issues/${issueId}/received`);
      if (response.data.success) {
        await fetchIssues();
        Swal.fire({
          title: 'Issue Received',
          text: 'Serial issue has been marked as received',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error marking received:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to mark as received',
        icon: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitInspection = async (issueId, inspectionStatus) => {
    const result = await Swal.fire({
      title: inspectionStatus === 'inspected' ? 'Mark as Inspected?' : 'Mark for Return?',
      text: inspectionStatus === 'inspected' 
        ? 'This will mark the issue as successfully inspected and delivered.'
        : 'This will mark the issue for return.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: inspectionStatus === 'inspected' ? '#28a745' : '#dc3545',
      confirmButtonText: inspectionStatus === 'inspected' ? 'Yes, Inspected' : 'Yes, Mark for Return',
    });

    if (!result.isConfirmed) return;

    setActionLoading(issueId);
    try {
      const response = await axios.post(`/api/subscriptions/${subscriptionId}/issues/${issueId}/inspection`, {
        inspection_status: inspectionStatus,
      });
      if (response.data.success) {
        await fetchIssues();
        if (onCostUpdate) onCostUpdate();
        Swal.fire({
          title: 'Inspection Submitted',
          text: `Issue has been marked as ${getInspectionStatusLabel(inspectionStatus)}`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to submit inspection',
        icon: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async (issueId) => {
    try {
      const response = await axios.put(`/api/subscriptions/${subscriptionId}/issues/${issueId}/notes`, {
        notes: noteText,
      });
      if (response.data.success) {
        await fetchIssues();
        setEditingNotes(null);
        Swal.fire({
          title: 'Notes Saved',
          icon: 'success',
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to save notes',
        icon: 'error',
      });
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
    if (filter === 'pending') return !['delivered', 'for_return'].includes(issue.status);
    if (filter === 'delivered') return issue.status === 'delivered';
    if (filter === 'for_return') return issue.status === 'for_return';
    return issue.status === filter;
  });

  // Determine available actions based on role and issue status
  const getAvailableActions = (issue) => {
    const actions = [];

    if (userRole === 'supplier') {
      if (issue.status === 'pending') {
        actions.push({ label: 'Accept', action: () => handleStatusUpdate(issue._id || issue.id, 'accepted'), color: '#0062f4' });
      }
      if (issue.status === 'accepted') {
        actions.push({ label: 'Prepare', action: () => handleStatusUpdate(issue._id || issue.id, 'prepare'), color: '#0c5460' });
      }
      if (issue.status === 'prepare') {
        actions.push({ label: 'For Delivery', action: () => handleStatusUpdate(issue._id || issue.id, 'for_delivery'), color: '#6f42c1' });
      }
    }

    if (userRole === 'gsps') {
      if (issue.status === 'for_delivery') {
        actions.push({ label: 'Mark Received', action: () => handleMarkReceived(issue._id || issue.id), color: '#28a745' });
      }
    }

    if (userRole === 'inspection') {
      if (issue.status === 'received' && !issue.inspection_status) {
        actions.push({ label: 'Inspected', action: () => handleSubmitInspection(issue._id || issue.id, 'inspected'), color: '#28a745' });
        actions.push({ label: 'For Return', action: () => handleSubmitInspection(issue._id || issue.id, 'for_return'), color: '#dc3545' });
      }
    }

    return actions;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <div className="spinner" style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #004A98',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        Loading serial issues...
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <FiPackage size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>No serial issues found for this subscription.</p>
        {userRole === 'tpu' && (
          <p style={{ fontSize: '13px', marginTop: '8px' }}>
            Serial issues will be automatically generated when creating a subscription with frequency and total issues specified.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ 
          background: '#E8F1FA', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#004A98' }}>{summary.total_issues || 0}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Total Issues</div>
        </div>
        <div style={{ 
          background: '#d4edda', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#155724' }}>{summary.delivered_issues || 0}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Delivered</div>
        </div>
        <div style={{ 
          background: '#fff3cd', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#856404' }}>{summary.pending_issues || 0}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Pending</div>
        </div>
        <div style={{ 
          background: '#f8d7da', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#721c24' }}>{summary.returned_issues || 0}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Returned</div>
        </div>
      </div>

      {/* Cost Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        background: '#f8f9fa',
        padding: '16px 24px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div>
          <span style={{ fontSize: '12px', color: '#666' }}>Total Cost</span>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#004A98' }}>
            {formatCurrency(summary.total_cost)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: '#666' }}>Delivered Cost</span>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#28a745' }}>
            {formatCurrency(summary.delivered_cost)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: '#666' }}>Remaining Cost</span>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#E67E22' }}>
            {formatCurrency(summary.remaining_cost)}
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'pending', 'for_delivery', 'received', 'delivered', 'for_return'].map(f => (
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
              transition: 'all 0.2s'
            }}
          >
            {f === 'all' ? 'All' : getStatusLabel(f)} 
            {f !== 'all' && ` (${issues.filter(i => f === 'pending' ? !['delivered', 'for_return'].includes(i.status) : i.status === f).length})`}
          </button>
        ))}
        <button
          onClick={fetchIssues}
          style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            borderRadius: '20px',
            background: '#fff',
            color: '#666',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginLeft: 'auto'
          }}
        >
          <MdRefresh /> Refresh
        </button>
      </div>

      {/* Issues Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '2px solid #ddd' }}>Issue #</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '2px solid #ddd' }}>Expected Delivery</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '2px solid #ddd' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '2px solid #ddd' }}>Received Date</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '2px solid #ddd' }}>Inspection</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '13px', borderBottom: '2px solid #ddd' }}>Cost</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px', borderBottom: '2px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.map((issue) => {
              const statusColor = getStatusColor(issue.status);
              const inspectionColor = getInspectionStatusColor(issue.inspection_status);
              const actions = getAvailableActions(issue);
              const issueId = issue._id || issue.id;

              return (
                <tr key={issueId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiPackage color="#004A98" />
                      <span style={{ fontWeight: 600, color: '#333' }}>#{issue.issue_number}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px', fontSize: '14px', color: '#666' }}>
                    {formatDate(issue.expected_delivery_date)}
                  </td>
                  <td style={{ padding: '14px 12px' }}>
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
                  <td style={{ padding: '14px 12px', fontSize: '14px', color: '#666' }}>
                    {formatDate(issue.received_at)}
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    {issue.status === 'received' || issue.status === 'delivered' || issue.status === 'for_return' ? (
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: inspectionColor.bg,
                        color: inspectionColor.text,
                        fontSize: 12,
                        fontWeight: 500,
                      }}>
                        {getInspectionStatusLabel(issue.inspection_status)}
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontSize: '13px' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: '#004A98' }}>
                    {formatCurrency(issue.cost)}
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {actionLoading === issueId ? (
                        <span style={{ fontSize: '12px', color: '#666' }}>Loading...</span>
                      ) : actions.length > 0 ? (
                        actions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={act.action}
                            style={{
                              padding: '6px 12px',
                              border: 'none',
                              borderRadius: '4px',
                              background: act.color,
                              color: '#fff',
                              fontSize: '12px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {act.label}
                          </button>
                        ))
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>
                          {issue.status === 'delivered' ? '✓ Complete' : issue.status === 'for_return' ? '✗ Returned' : '-'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredIssues.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          No issues match the selected filter.
        </div>
      )}
    </div>
  );
};

export default SerialIssuesTable;
