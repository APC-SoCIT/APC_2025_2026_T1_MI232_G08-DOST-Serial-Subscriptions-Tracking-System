import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TPULayout from '@/Layouts/TPULayout';
import { MdSearch, MdFilterList, MdRefresh } from "react-icons/md";
import { FiTrendingUp, FiTrendingDown, FiPackage, FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi";

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
      title: 'Pending Inspection', 
      value: stats.pending, 
      icon: <FiClock />,
      color: '#D97706',
      bgColor: '#FEF3C7'
    },
  ];

  const getDeliveryStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return '#d4edda';
      case 'Pending': return '#fff3cd';
      case 'For Return': return '#f8d7da';
      default: return '#e2e3e5';
    }
  };

  const getDeliveryStatusTextColor = (status) => {
    switch(status) {
      case 'Delivered': return '#155724';
      case 'Pending': return '#856404';
      case 'For Return': return '#721c24';
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
            <p style={{ color: '#666', margin: 0, fontSize: 14 }}>Track serials that have been inspected</p>
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
              <option value="Delivered">Delivered</option>
              <option value="Pending">Pending</option>
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
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Inspector</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    Loading delivery data...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
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
                    <td style={{ padding: '16px', textAlign: 'center', color: '#555' }}>
                      {delivery.inspector_name || '-'}
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    {searchTerm || statusFilter !== 'All' || dateFilter
                      ? 'No serials match your search/filter criteria.' 
                      : 'No inspected serials yet. Serials will appear here once the inspection team submits their inspection.'}
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
    </div>
  );
}

export default function DashboardTPUMonitorDelivery() {
  return (
    <TPULayout hideTitle={true}>
      <MonitorDelivery />
    </TPULayout>
  );
}