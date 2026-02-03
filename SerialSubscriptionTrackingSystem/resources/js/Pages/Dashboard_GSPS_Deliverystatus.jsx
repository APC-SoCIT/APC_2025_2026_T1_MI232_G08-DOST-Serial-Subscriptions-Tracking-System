import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GSPSLayout from '@/Layouts/GSPSLayout';
import { MdSearch, MdFilterList } from "react-icons/md";

// Delivery Status Component - MATCHING YOUR IMAGE EXACTLY
function DeliveryStatus() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, item: null });
  
  // API data state
  const [deliveryData, setDeliveryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch delivery serials from API
  useEffect(() => {
    fetchDeliverySerials();
  }, []);

  const fetchDeliverySerials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/subscriptions/delivery-serials');
      
      if (response.data.success) {
        setDeliveryData(response.data.serials || []);
      }
    } catch (err) {
      console.error('Error fetching delivery serials:', err);
      setError('Failed to load delivery data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle confirm receipt
  const handleConfirmReceipt = async () => {
    if (!confirmModal.item) return;
    
    try {
      const response = await axios.put(`/api/subscriptions/${confirmModal.item.subscription_id}/serial-received`, {
        serial_issn: confirmModal.item.issn
      });
      
      if (response.data.success) {
        // Update local state with received date
        setDeliveryData(prev => prev.map(item => 
          item.id === confirmModal.item.id 
            ? { ...item, status: 'received', receivedDate: response.data.receivedDate }
            : item
        ));
      } else {
        alert('Failed to confirm receipt. Please try again.');
      }
    } catch (err) {
      console.error('Error confirming receipt:', err);
      alert('Failed to confirm receipt. Please try again.');
    }
    
    setConfirmModal({ show: false, item: null });
  };

  // Filter data
  const filteredData = deliveryData.filter(item => {
    const matchesSearch = 
      (item.serialTitle && item.serialTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      filter === 'All' || 
      (filter === 'Received' && item.status === 'received') ||
      (filter === 'For Delivery' && item.status === 'for_delivery');
    
    return matchesSearch && matchesFilter;
  });

  // Calculate totals
  const totalForDelivery = deliveryData.filter(item => item.status === 'for_delivery').length;
  const totalReceived = deliveryData.filter(item => item.status === 'received').length;
  const totalItems = deliveryData.length;

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 120px)' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Total Deliveries</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#004A98' }}>{totalItems}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>For Delivery</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#17a2b8' }}>{totalForDelivery}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Received</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#28a745' }}>{totalReceived}</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ color: '#004A98', margin: '0 0 8px 0', fontSize: 20 }}>Delivery Tracking</h2>
            <p style={{ color: '#666', margin: 0, fontSize: 14 }}>Current status of all serial deliveries</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search serial title or supplier..."
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

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFilter(!showFilter)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              <MdFilterList /> Filter
            </button>
            
            {showFilter && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: '#fff',
                borderRadius: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: 16,
                width: 180,
                zIndex: 10,
                marginTop: 8,
              }}>
                <p style={{ margin: '0 0 12px 0', fontWeight: 500, fontSize: 14 }}>Filter Status</p>
                {['All', 'For Delivery', 'Received'].map(option => (
                  <label key={option} style={{ display: 'block', marginBottom: 10, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="radio"
                      checked={filter === option}
                      onChange={() => {
                        setFilter(option);
                        setShowFilter(false);
                      }}
                      style={{ marginRight: 8 }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table - EXACTLY LIKE YOUR IMAGE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                background: 'linear-gradient(90deg, #004A98, #0062f4)',
                color: '#fff'
              }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Serial Title</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Supplier Name</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Delivery Date</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Confirmation</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Received Date</th>
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
                    <button 
                      onClick={fetchDeliverySerials}
                      style={{ marginLeft: 16, padding: '8px 16px', background: '#004A98', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr 
                    key={item.id} 
                    style={{ 
                      borderBottom: '1px solid #eee',
                      background: index % 2 === 0 ? '#fff' : '#f9f9f9'
                    }}
                  >
                    <td style={{ padding: '16px', fontWeight: 500 }}>{item.serialTitle}</td>
                    <td style={{ padding: '16px' }}>{item.supplierName}</td>
                    <td style={{ 
                      padding: '16px', 
                      textAlign: 'center',
                      color: '#555'
                    }}>
                      {item.deliveryDate 
                        ? new Date(item.deliveryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '-'
                      }
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {item.status === 'received' ? (
                        <span
                          style={{
                            padding: '8px 20px',
                            borderRadius: 20,
                            background: '#28a745',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Received
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ show: true, item: item })}
                          style={{
                            padding: '8px 20px',
                            borderRadius: 6,
                            border: 'none',
                            background: '#004A98',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => e.target.style.background = '#003875'}
                          onMouseOut={(e) => e.target.style.background = '#004A98'}
                        >
                          Confirm
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#555' }}>
                      {item.receivedDate 
                        ? new Date(item.receivedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '-'
                      }
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    {searchTerm ? `No deliveries found matching "${searchTerm}"` : 'No deliveries awaiting confirmation yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div style={{ 
          marginTop: 30,
          paddingTop: 20,
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          color: '#666',
          fontSize: 14
        }}>
          <div>
            Showing {filteredData.length} of {deliveryData.length} deliveries
            {filter !== 'All' && ` (${filter} only)`}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
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
          onClick={() => setConfirmModal({ show: false, item: null })}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '32px 40px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
              maxWidth: 400,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 20, color: '#222' }}>
              Confirm Receipt
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: 15, color: '#666' }}>
              Are you sure you have received this delivery?
            </p>
            {confirmModal.item && (
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#004A98', fontWeight: 600 }}>
                "{confirmModal.item.serialTitle}" from {confirmModal.item.supplierName}
              </p>
            )}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={handleConfirmReceipt}
                style={{
                  padding: '10px 32px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#28a745',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.target.style.background = '#218838'}
                onMouseOut={(e) => e.target.style.background = '#28a745'}
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmModal({ show: false, item: null })}
                style={{
                  padding: '10px 32px',
                  borderRadius: 6,
                  border: '1px solid #dc3545',
                  background: '#fff',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => { e.target.style.background = '#dc3545'; e.target.style.color = '#fff'; }}
                onMouseOut={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#dc3545'; }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardGSPSDeliveryStatus() {
  return (
    <GSPSLayout title="Delivery Status">
      <DeliveryStatus />
    </GSPSLayout>
  );
}