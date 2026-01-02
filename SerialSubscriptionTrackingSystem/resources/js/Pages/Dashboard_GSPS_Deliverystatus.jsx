import React, { useState } from 'react';
import GSPSLayout from '@/Layouts/GSPSLayout';
import { MdSearch, MdFilterList } from "react-icons/md";

// Delivery Status Component - MATCHING YOUR IMAGE EXACTLY
function DeliveryStatus() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  // EXACT DATA FROM YOUR IMAGE
  const deliveryData = [
    {
      id: 1,
      serialTitle: 'Nature',
      supplierName: 'ABC Books Supplier',
      totalIssuesExpected: 12,
      totalIssuesDelivered: 10,
      totalIssuesUndelivered: 2,
      deliveryRate: '83.33%'
    },
    {
      id: 2,
      serialTitle: 'The Lancet',
      supplierName: 'MedJournal Suppliers Inc.',
      totalIssuesExpected: 24,
      totalIssuesDelivered: 24,
      totalIssuesUndelivered: 0,
      deliveryRate: '100%'
    },
    {
      id: 3,
      serialTitle: 'Science',
      supplierName: 'Global Periodicals Co.',
      totalIssuesExpected: 12,
      totalIssuesDelivered: 11,
      totalIssuesUndelivered: 1,
      deliveryRate: '91.66%'
    },
    {
      id: 4,
      serialTitle: 'Asian Economic Review',
      supplierName: 'EastAsia Books & Journals',
      totalIssuesExpected: 4,
      totalIssuesDelivered: 4,
      totalIssuesUndelivered: 0,
      deliveryRate: '100%'
    },
    {
      id: 5,
      serialTitle: 'Medical Digest',
      supplierName: 'MedJournal Suppliers Inc.',
      totalIssuesExpected: 24,
      totalIssuesDelivered: 22,
      totalIssuesUndelivered: 2,
      deliveryRate: '91.66%'
    }
  ];

  // Filter data
  const filteredData = deliveryData.filter(item => {
    const matchesSearch = 
      item.serialTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === 'All' || 
      (filter === 'Complete' && item.deliveryRate === '100%') ||
      (filter === 'Pending' && item.deliveryRate !== '100%');
    
    return matchesSearch && matchesFilter;
  });

  // Calculate totals
  const totalExpected = deliveryData.reduce((sum, item) => sum + item.totalIssuesExpected, 0);
  const totalDelivered = deliveryData.reduce((sum, item) => sum + item.totalIssuesDelivered, 0);
  const totalUndelivered = deliveryData.reduce((sum, item) => sum + item.totalIssuesUndelivered, 0);
  const overallRate = ((totalDelivered / totalExpected) * 100).toFixed(2) + '%';

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 120px)' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Total Expected Issues</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#004A98' }}>{totalExpected}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Total Delivered</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#28a745' }}>{totalDelivered}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Pending Delivery</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#ffc107' }}>{totalUndelivered}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Overall Rate</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#17a2b8' }}>{overallRate}</p>
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
                {['All', 'Complete', 'Pending'].map(option => (
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
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Total Issues Expected</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Total Issues Delivered</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Total Issues Undelivered</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Delivery Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr 
                  key={item.id} 
                  style={{ 
                    borderBottom: '1px solid #eee',
                    background: index % 2 === 0 ? '#fff' : '#f9f9f9'
                  }}
                >
                  <td style={{ padding: '16px', fontWeight: 500 }}>{item.serialTitle}</td>
                  <td style={{ padding: '16px' }}>{item.supplierName}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>{item.totalIssuesExpected}</td>
                  <td style={{ 
                    padding: '16px', 
                    textAlign: 'center',
                    color: item.totalIssuesDelivered === item.totalIssuesExpected ? '#28a745' : '#333',
                    fontWeight: item.totalIssuesDelivered === item.totalIssuesExpected ? 600 : 400
                  }}>
                    {item.totalIssuesDelivered}
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    textAlign: 'center',
                    color: item.totalIssuesUndelivered > 0 ? '#dc3545' : '#666'
                  }}>
                    {item.totalIssuesUndelivered}
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    textAlign: 'center',
                    fontWeight: 600,
                    color: item.deliveryRate === '100%' ? '#28a745' : 
                           parseFloat(item.deliveryRate) > 90 ? '#17a2b8' : '#ffc107'
                  }}>
                    {item.deliveryRate}
                    {item.deliveryRate === '100%' && (
                      <span style={{ 
                        marginLeft: 8,
                        fontSize: 12,
                        background: '#d4edda',
                        color: '#155724',
                        padding: '2px 8px',
                        borderRadius: 10
                      }}>
                        ✓
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div style={{ 
          marginTop: 30,
          paddingTop: 20,
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#666',
          fontSize: 14
        }}>
          <div>
            Showing {filteredData.length} of {deliveryData.length} deliveries
            {filter !== 'All' && ` (${filter} only)`}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>Total Items: {deliveryData.length}</span>
            <div style={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              background: '#28a745',
              marginRight: 4
            }}></div>
            <span>Complete: {deliveryData.filter(d => d.deliveryRate === '100%').length}</span>
            <div style={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              background: '#ffc107',
              marginRight: 4
            }}></div>
            <span>Pending: {deliveryData.filter(d => d.deliveryRate !== '100%').length}</span>
          </div>
        </div>
      </div>
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