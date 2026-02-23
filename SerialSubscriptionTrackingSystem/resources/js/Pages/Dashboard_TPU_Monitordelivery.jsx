import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TPULayout from '@/Layouts/TPULayout';
import { MdSearch, MdFilterList, MdRefresh, MdVisibility, MdClose, MdImage } from "react-icons/md";
import { FiTrendingUp, FiTrendingDown, FiPackage, FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi";
import { FaHistory } from "react-icons/fa";
import ProcessMovementHistory from "@/Components/ProcessMovementHistory";

// Monitor Delivery Component
function MonitorDelivery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  
  // API data state
  const [deliveryData, setDeliveryData] = useState([]);
  const [stats, setStats] = useState({ total: 0, delivered: 0, for_return: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [viewModal, setViewModal] = useState({ show: false, item: null });
  const [historyModal, setHistoryModal] = useState({ open: false, serial: null });

  // Fetch monitored deliveries from API
  useEffect(() => {
    fetchMonitoredDeliveries();
  }, []);

  const fetchMonitoredDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/subscriptions/monitored-deliveries');
      
      if (response.data.success) {
        setDeliveryData(response.data.serials || []);
        setStats(response.data.stats || { total: 0, delivered: 0, for_return: 0, pending: 0 });
      }
    } catch (err) {
      console.error('Error fetching monitored deliveries:', err);
      setError('Failed to load delivery data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter deliveries
  const filteredDeliveries = deliveryData.filter(delivery => {
    const matchesSearch = 
      (delivery.serialTitle && delivery.serialTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (delivery.supplierName && delivery.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (delivery.issn && delivery.issn.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || delivery.deliveryStatus === statusFilter;
    
    const matchesDate = !dateFilter || 
      (delivery.inspectionDate && delivery.inspectionDate.startsWith(dateFilter));
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate delivery rate
  const deliveryRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;

  const statsCards = [
    { 
      title: 'Total Serials', 
      value: stats.total, 
      icon: <FiPackage />,
      color: '#004A98',
      bgColor: '#E8F1FA'
    },
    { 
      title: 'Delivered', 
      value: stats.delivered, 
      icon: <FiCheckCircle />,
      color: '#0D9488',
      bgColor: '#E6F7F5'
    },
    { 
      title: 'For Return', 
      value: stats.for_return, 
      icon: <FiAlertCircle />,
      color: '#DC2626',
      bgColor: '#FEE2E2'
    },
    { 
      title: 'In Progress', 
      value: (stats.preparing || 0) + (stats.for_delivery || 0) + (stats.received || 0),
      icon: <FiClock />,
      color: '#D97706',
      bgColor: '#FEF3C7'
    },
  ];

  const getDeliveryStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return '#d4edda';
      case 'Accepted': return '#e8f4fd';
      case 'Preparing': return '#fff3cd';
      case 'For Delivery': return '#cce5ff';
      case 'Received': return '#d1ecf1';
      case 'For Return': return '#f8d7da';
      case 'Pending': return '#e2e3e5';
      default: return '#e2e3e5';
    }
  };

  const getDeliveryStatusTextColor = (status) => {
    switch(status) {
      case 'Delivered': return '#155724';
      case 'Accepted': return '#004A98';
      case 'Preparing': return '#856404';
      case 'For Delivery': return '#004085';
      case 'Received': return '#0c5460';
      case 'For Return': return '#721c24';
      case 'Pending': return '#383d41';
      default: return '#383d41';
    }
  };

  return (
    <div style={{ background: '#fff', minHeight: 'calc(100vh - 73px)', padding: '24px 32px' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        {statsCards.map((stat, index) => (
          <div
            key={index}
            style={{
              background: stat.bgColor,
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${stat.color}`,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0', fontWeight: 500 }}>
                  {stat.title}
                </h3>
                <p style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  margin: 0,
                  color: stat.color
                }}>
                  {stat.value}
                </p>
              </div>
              <div style={{
                color: stat.color,
                fontSize: 24,
                opacity: 0.8
              }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>

        {/* Header with refresh button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: '#004A98', margin: '0 0 8px 0', fontSize: 20 }}>Delivery Monitoring</h2>
            <p style={{ color: '#666', margin: 0, fontSize: 14 }}></p>
          </div>
          <button
            onClick={fetchMonitoredDeliveries}
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

        {/* Search and Filter Bar */}
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

          <div style={{ display: 'flex', gap: 12 }}>
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
              <option value="Accepted">Accepted</option>
              <option value="Preparing">Preparing</option>
              <option value="For Delivery">For Delivery</option>
              <option value="Received">Received</option>
              <option value="Delivered">Delivered</option>
              <option value="For Return">For Return</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14,
                background: '#fff',
              }}
            />

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setDateFilter('');
              }}
              style={{
                padding: '12px 20px',
                background: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <MdFilterList /> Clear Filters
            </button>
          </div>
        </div>

        {/* Delivery Monitoring Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                background: 'linear-gradient(90deg, #004A98, #0062f4)',
                color: '#fff'
              }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>ISSN</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Serial Title</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Supplier</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Inspection Date</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    Loading delivery data...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
                    {error}
                    <button 
                      onClick={fetchMonitoredDeliveries}
                      style={{ marginLeft: 16, padding: '8px 16px', background: '#004A98', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredDeliveries.length > 0 ? (
                filteredDeliveries.map((delivery, index) => (
                  <tr 
                    key={delivery.id} 
                    style={{ 
                      borderBottom: '1px solid #eee',
                      background: index % 2 === 0 ? '#fff' : '#f9f9f9'
                    }}
                  >
                    <td style={{ padding: '16px', fontWeight: 500 }}>{delivery.issn}</td>
                    <td style={{ padding: '16px' }}>{delivery.serialTitle}</td>
                    <td style={{ padding: '16px' }}>{delivery.supplierName}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#555' }}>
                      {delivery.inspectionDate 
                        ? new Date(delivery.inspectionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '-'
                      }
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '6px 16px',
                        borderRadius: 20,
                        background: getDeliveryStatusColor(delivery.deliveryStatus),
                        color: getDeliveryStatusTextColor(delivery.deliveryStatus),
                        fontSize: 12,
                        fontWeight: 500,
                        display: 'inline-block',
                      }}>
                        {delivery.deliveryStatus}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={() => setViewModal({ show: true, item: delivery })}
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
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#17a2b8'; e.currentTarget.style.color = '#fff'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = '#17a2b8'; }}
                          title="View Serial Details"
                        >
                          <MdVisibility size={14} /> View
                        </button>
                        <button
                          onClick={() => setHistoryModal({ open: true, serial: delivery })}
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
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#004A98'; e.currentTarget.style.color = '#fff'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = '#004A98'; }}
                          title="View Process Movement History"
                        >
                          <FaHistory size={10} /> History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    {searchTerm || statusFilter !== 'All' || dateFilter
                      ? 'No serials match your search/filter criteria.' 
                      : 'No serials yet. Serials will appear here once subscriptions are created.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, color: '#666', fontSize: 14 }}>
          <div>
            Showing {filteredDeliveries.length} of {deliveryData.length} results
          </div>
        </div>
      </div>

      {/* View Serial Details Modal */}
      {viewModal.show && viewModal.item && (
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
          onClick={() => setViewModal({ show: false, item: null })}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '32px 40px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              maxWidth: 700,
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, color: '#004A98' }}>Serial Details</h3>
              <button
                onClick={() => setViewModal({ show: false, item: null })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <MdClose size={24} color="#666" />
              </button>
            </div>

            {/* Serial Information */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 16, color: '#333', borderBottom: '2px solid #004A98', paddingBottom: 8 }}>
                {viewModal.item.serialTitle}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>ISSN</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.issn || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Supplier</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.supplierName || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Frequency</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.frequency || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Quantity</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.quantity || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Delivery Date</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                    {viewModal.item.deliveryDate 
                      ? new Date(viewModal.item.deliveryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Inspection Date</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                    {viewModal.item.inspectionDate 
                      ? new Date(viewModal.item.inspectionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Status</p>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    background: getDeliveryStatusColor(viewModal.item.deliveryStatus),
                    color: getDeliveryStatusTextColor(viewModal.item.deliveryStatus),
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {viewModal.item.deliveryStatus}
                  </span>
                </div>
                {viewModal.item.inspector_name && (
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Inspector</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.inspector_name}</p>
                  </div>
                )}
                {viewModal.item.condition && (
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Condition</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.condition}</p>
                  </div>
                )}
                {viewModal.item.inspection_remarks && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Inspection Remarks</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.inspection_remarks}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments Section */}
            <div>
              <h4 style={{ margin: '0 0 16px', fontSize: 16, color: '#333', borderBottom: '2px solid #004A98', paddingBottom: 8 }}>
                Attachments
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Receipt Attachment */}
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 500, color: '#333' }}>Receipt Image</p>
                  {viewModal.item.attachmentUrl ? (
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={viewModal.item.attachmentUrl}
                        alt="Receipt Attachment"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 200,
                          borderRadius: 8,
                          border: '1px solid #ddd',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(viewModal.item.attachmentUrl, '_blank');
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <p style={{ margin: '8px 0 0', fontSize: 11, color: '#666' }}>
                        Click to view full size
                      </p>
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: 30, 
                      background: '#f8f9fa', 
                      borderRadius: 8,
                      color: '#666',
                    }}>
                      <MdImage size={32} style={{ opacity: 0.3, marginBottom: 4 }} />
                      <p style={{ margin: 0, fontSize: 12 }}>No receipt image</p>
                    </div>
                  )}
                </div>
                
                {/* Inspection Attachment */}
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 500, color: '#333' }}>Inspection Image</p>
                  {viewModal.item.inspection_attachment ? (
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={viewModal.item.inspection_attachment}
                        alt="Inspection Attachment"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 200,
                          borderRadius: 8,
                          border: '1px solid #ddd',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(viewModal.item.inspection_attachment, '_blank');
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <p style={{ margin: '8px 0 0', fontSize: 11, color: '#666' }}>
                        Click to view full size
                      </p>
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: 30, 
                      background: '#f8f9fa', 
                      borderRadius: 8,
                      color: '#666',
                    }}>
                      <MdImage size={32} style={{ opacity: 0.3, marginBottom: 4 }} />
                      <p style={{ margin: 0, fontSize: 12 }}>No inspection image</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button
                onClick={() => setViewModal({ show: false, item: null })}
                style={{
                  padding: '10px 32px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#004A98',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Movement History Modal */}
      <ProcessMovementHistory
        isOpen={historyModal.open}
        onClose={() => setHistoryModal({ open: false, serial: null })}
        recordType="subscription"
        recordId={historyModal.serial?.subscription_id}
        title={historyModal.serial?.serialTitle}
      />
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