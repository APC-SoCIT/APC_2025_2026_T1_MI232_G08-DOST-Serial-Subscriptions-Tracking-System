import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHistory, FaTimes, FaArrowRight, FaUser, FaCalendarAlt, FaSpinner } from 'react-icons/fa';
import { MdOutlineTimeline } from 'react-icons/md';

/**
 * Process Movement History Modal Component
 * Shows the workflow history/timeline for a serial or subscription
 * 
 * Props:
 * - isOpen: boolean - whether to show the modal
 * - onClose: function - callback to close the modal
 * - recordType: string - 'subscription' or 'serial'
 * - recordId: string - the ID of the record to get history for
 * - title: string - optional title to display in the header
 */
export default function ProcessMovementHistory({ isOpen, onClose, recordType, recordId, title }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && recordType && recordId) {
      fetchHistory();
    }
  }, [isOpen, recordType, recordId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/workflow-history', {
        params: {
          record_type: recordType,
          record_id: recordId,
        }
      });
      
      if (response.data.success) {
        setHistory(response.data.history || []);
      }
    } catch (err) {
      console.error('Error fetching workflow history:', err);
      setError('Failed to load workflow history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action) => {
    const actionLabels = {
      'create': 'Subscription Created',
      'accept': 'Accepted by Supplier',
      'preparing': 'Preparing by Supplier',
      'ready_for_delivery': 'Ready for Delivery',
      'status_change': 'Status Updated',
      'approve': 'Approved',
      'reject': 'Rejected',
      'inspect': 'Inspection Completed',
      'pending_inspection': 'Pending Inspection',
      'deliver': 'Delivered',
      'receive': 'Received by GSPS',
      'return': 'Marked For Return',
      'update': 'Updated',
    };
    return actionLabels[action] || action;
  };

  const getActionColor = (action) => {
    const actionColors = {
      'create': '#004A98',
      'accept': '#28a745',
      'preparing': '#ffc107',
      'ready_for_delivery': '#17a2b8',
      'status_change': '#17a2b8',
      'approve': '#28a745',
      'reject': '#dc3545',
      'inspect': '#6f42c1',
      'pending_inspection': '#fd7e14',
      'deliver': '#28a745',
      'receive': '#20c997',
      'return': '#dc3545',
      'update': '#007bff',
    };
    return actionColors[action] || '#6c757d';
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    
    const statusLabels = {
      'pending': 'Pending',
      'created': 'Created',
      'accepted': 'Accepted',
      'prepare': 'Preparing',
      'for_delivery': 'For Delivery',
      'received': 'Received',
      'pending_inspection': 'Pending Inspection',
      'inspected': 'Inspected',
      'delivered': 'Delivered',
      'for_return': 'For Return',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'Active': 'Active',
      'Inactive': 'Inactive',
      'Completed': 'Completed',
    };
    
    const statusColors = {
      'pending': '#ffc107',
      'created': '#004A98',
      'accepted': '#28a745',
      'prepare': '#ffc107',
      'for_delivery': '#17a2b8',
      'received': '#20c997',
      'pending_inspection': '#fd7e14',
      'inspected': '#6f42c1',
      'delivered': '#28a745',
      'for_return': '#dc3545',
      'approved': '#28a745',
      'rejected': '#dc3545',
      'Active': '#28a745',
      'Inactive': '#6c757d',
      'Completed': '#17a2b8',
    };

    return (
      <span style={{
        background: statusColors[status] || '#6c757d',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 500,
      }}>
        {statusLabels[status] || status.replace('_', ' ')}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '100%',
          maxWidth: 700,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #e9ecef',
          background: '#004A98',
          borderRadius: '12px 12px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MdOutlineTimeline size={24} color="#fff" />
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>
                Process Movement History
              </h3>
              {title && (
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
                  {title}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              padding: 8,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 24,
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <FaSpinner className="spin" size={32} color="#004A98" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#666', marginTop: 12 }}>Loading history...</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 0',
              color: '#dc3545',
            }}>
              <p>{error}</p>
              <button
                onClick={fetchHistory}
                style={{
                  marginTop: 12,
                  padding: '8px 16px',
                  background: '#004A98',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : history.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#666',
            }}>
              <FaHistory size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: 16, fontWeight: 500 }}>No movement history found</p>
              <p style={{ fontSize: 13, opacity: 0.7 }}>
                The workflow history will appear here once actions are performed on this record.
              </p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Timeline line */}
              <div style={{
                position: 'absolute',
                left: 15,
                top: 0,
                bottom: 0,
                width: 2,
                background: '#e9ecef',
              }} />

              {/* Timeline items */}
              {history.map((item, index) => (
                <div
                  key={item._id || index}
                  style={{
                    display: 'flex',
                    gap: 16,
                    marginBottom: 24,
                    position: 'relative',
                  }}
                >
                  {/* Timeline dot */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: getActionColor(item.action),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    zIndex: 1,
                  }}>
                    <FaHistory size={14} color="#fff" />
                  </div>

                  {/* Content card */}
                  <div style={{
                    flex: 1,
                    background: '#f8f9fa',
                    borderRadius: 8,
                    padding: 16,
                    border: '1px solid #e9ecef',
                  }}>
                    {/* Action header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}>
                      <span style={{
                        background: getActionColor(item.action),
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {getActionLabel(item.action)}
                      </span>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        color: '#666',
                      }}>
                        <FaCalendarAlt size={10} />
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    {/* Status change */}
                    {(item.status_from || item.status_to) && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 12,
                        padding: '8px 12px',
                        background: '#fff',
                        borderRadius: 6,
                      }}>
                        {item.status_from && getStatusBadge(item.status_from)}
                        {item.status_from && item.status_to && (
                          <FaArrowRight size={12} color="#666" />
                        )}
                        {item.status_to && getStatusBadge(item.status_to)}
                      </div>
                    )}

                    {/* User info */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      fontSize: 13,
                      color: '#555',
                      flexWrap: 'wrap',
                    }}>
                      {item.from_user_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FaUser size={10} />
                          <span>From: <strong>{item.from_user_name}</strong></span>
                          {item.from_role && (
                            <span style={{
                              background: '#e9ecef',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 10,
                              textTransform: 'uppercase',
                              marginLeft: 4,
                            }}>
                              {item.from_role}
                            </span>
                          )}
                        </div>
                      )}
                      {item.to_user_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FaArrowRight size={10} />
                          <span>To: <strong>{item.to_user_name}</strong></span>
                          {item.to_role && (
                            <span style={{
                              background: '#e9ecef',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 10,
                              textTransform: 'uppercase',
                              marginLeft: 4,
                            }}>
                              {item.to_role}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Remarks */}
                    {item.remarks && (
                      <div style={{
                        marginTop: 12,
                        padding: '8px 12px',
                        background: '#fff',
                        borderRadius: 6,
                        borderLeft: '3px solid #004A98',
                        fontSize: 13,
                        color: '#333',
                      }}>
                        <strong style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>
                          Remarks:
                        </strong>
                        {item.remarks}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
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
  );
}
