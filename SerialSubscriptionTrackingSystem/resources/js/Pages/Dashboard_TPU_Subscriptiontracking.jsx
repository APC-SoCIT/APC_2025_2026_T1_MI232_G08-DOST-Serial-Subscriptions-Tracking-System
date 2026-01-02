import React, { useState } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { MdSearch, MdFilterList, MdOutlineInfo } from "react-icons/md";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

// Subscription Tracking Component
function SubscriptionTracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [sortBy, setSortBy] = useState('serialTitle');

  // Subscription data from your image
  const subscriptionData = [
    {
      id: 1,
      serialTitle: 'Nature',
      supplierName: 'ABC Books Supplier',
      period: 'Jan-Dec 2025',
      awardCost: 'P60,000',
      deliveredCost: 'P50,000',
      remainingCost: 'P10,000',
      status: 'Active',
      paymentStatus: 'Partially Paid',
      progress: 83 // 50,000/60,000 * 100
    },
    {
      id: 2,
      serialTitle: 'The Lancet',
      supplierName: 'MedJournal Suppliers Inc.',
      period: 'Jan-Dec 2025',
      awardCost: 'P120,000',
      deliveredCost: 'P120,000',
      remainingCost: 'P0',
      status: 'Active',
      paymentStatus: 'Fully Paid',
      progress: 100
    },
    {
      id: 3,
      serialTitle: 'Science',
      supplierName: 'Global Periodicals Co.',
      period: 'Jan-Dec 2025',
      awardCost: 'P40,000',
      deliveredCost: 'P40,000',
      remainingCost: 'P15,000',
      status: 'Active',
      paymentStatus: 'Overpaid',
      progress: 100,
      note: 'Overpayment detected'
    },
    {
      id: 4,
      serialTitle: 'Asian Economic Review',
      supplierName: 'EastAsia Books & Journals',
      period: 'Jan-Dec 2025',
      awardCost: 'P58,000',
      deliveredCost: 'P58,000',
      remainingCost: 'P0',
      status: 'Active',
      paymentStatus: 'Fully Paid',
      progress: 100
    },
    {
      id: 5,
      serialTitle: 'Medical Digest',
      supplierName: 'MedJournal Suppliers Inc.',
      period: 'Jan-Dec 2025',
      awardCost: 'P20,000',
      deliveredCost: 'P20,000',
      remainingCost: 'P0',
      status: 'Active',
      paymentStatus: 'Fully Paid',
      progress: 100
    },
  ];

  // Filter subscriptions
  const filteredSubscriptions = subscriptionData.filter(subscription => {
    const matchesSearch = 
      subscription.serialTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPeriod = periodFilter === 'All' || subscription.period.includes(periodFilter);
    
    return matchesSearch && matchesPeriod;
  });

  // Sort subscriptions
  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    if (sortBy === 'serialTitle') return a.serialTitle.localeCompare(b.serialTitle);
    if (sortBy === 'supplierName') return a.supplierName.localeCompare(b.supplierName);
    if (sortBy === 'remainingCost') {
      const aCost = parseFloat(a.remainingCost.replace(/[^0-9.]/g, '') || 0);
      const bCost = parseFloat(b.remainingCost.replace(/[^0-9.]/g, '') || 0);
      return bCost - aCost;
    }
    return 0;
  });

  // Calculate total stats
  const totalAwardCost = subscriptionData.reduce((sum, item) => {
    const cost = parseFloat(item.awardCost.replace(/[^0-9.]/g, '') || 0);
    return sum + cost;
  }, 0);

  const totalDeliveredCost = subscriptionData.reduce((sum, item) => {
    const cost = parseFloat(item.deliveredCost.replace(/[^0-9.]/g, '') || 0);
    return sum + cost;
  }, 0);

  const totalRemainingCost = subscriptionData.reduce((sum, item) => {
    const cost = parseFloat(item.remainingCost.replace(/[^0-9.]/g, '') || 0);
    return sum + cost;
  }, 0);

  const paymentRate = Math.round((totalDeliveredCost / totalAwardCost) * 100);

  const stats = [
    { 
      title: 'Total Award Cost', 
      value: `P${totalAwardCost.toLocaleString()}`, 
      icon: <FiTrendingUp />,
      color: '#004A98',
      trend: 'up'
    },
    { 
      title: 'Total Delivered Cost', 
      value: `P${totalDeliveredCost.toLocaleString()}`, 
      icon: <FiTrendingUp />,
      color: '#28a745',
      trend: 'up'
    },
    { 
      title: 'Total Remaining Cost', 
      value: `P${totalRemainingCost.toLocaleString()}`, 
      icon: totalRemainingCost > 0 ? <FiTrendingDown /> : <FiTrendingUp />,
      color: totalRemainingCost > 0 ? '#dc3545' : '#28a745',
      trend: totalRemainingCost > 0 ? 'down' : 'up'
    },
    { 
      title: 'Payment Rate', 
      value: `${paymentRate}%`, 
      icon: paymentRate >= 90 ? <FiTrendingUp /> : <FiTrendingDown />,
      color: paymentRate >= 90 ? '#28a745' : paymentRate >= 70 ? '#ffc107' : '#dc3545',
      trend: paymentRate >= 90 ? 'up' : 'down'
    },
  ];

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'Fully Paid': return '#d4edda';
      case 'Partially Paid': return '#fff3cd';
      case 'Overpaid': return '#cce5ff';
      default: return '#e2e3e5';
    }
  };

  const getPaymentStatusTextColor = (status) => {
    switch(status) {
      case 'Fully Paid': return '#155724';
      case 'Partially Paid': return '#856404';
      case 'Overpaid': return '#004085';
      default: return '#383d41';
    }
  };

  const handleViewDetails = (id) => {
    alert(`Viewing details for subscription ID: ${id}`);
  };

  // Progress bar component
  const ProgressBar = ({ progress }) => (
    <div style={{ 
      width: '100%', 
      height: 8, 
      background: '#e9ecef', 
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 4
    }}>
      <div style={{
        width: `${progress}%`,
        height: '100%',
        background: progress >= 100 ? '#28a745' : progress >= 70 ? '#ffc107' : '#dc3545',
        borderRadius: 4,
        transition: 'width 0.3s ease'
      }} />
    </div>
  );

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 120px)' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 30 }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
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
            
            {/* Progress indicator for Payment Rate */}
            {stat.title === 'Payment Rate' && (
              <div style={{ marginTop: 16 }}>
                <ProgressBar progress={paymentRate} />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: 12, 
                  color: '#666',
                  marginTop: 4
                }}>
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Content Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#004A98', margin: 0, fontSize: 20 }}>Subscription Details</h2>
        </div>

        {/* Search and Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search subscriptions..."
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
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14,
                background: '#fff',
                minWidth: 150,
              }}
            >
              <option value="All">All Periods</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14,
                background: '#fff',
                minWidth: 150,
              }}
            >
              <option value="serialTitle">Sort by Title</option>
              <option value="supplierName">Sort by Supplier</option>
              <option value="remainingCost">Sort by Remaining Cost</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setPeriodFilter('All');
                setSortBy('serialTitle');
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

        {/* Subscription Details Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Serial Title</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Supplier Name</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Period</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Award Cost</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Delivered Cost</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Remaining Cost</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Payment Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Progress</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSubscriptions.map((subscription) => (
                <tr key={subscription.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>{subscription.serialTitle}</td>
                  <td style={{ padding: '16px' }}>{subscription.supplierName}</td>
                  <td style={{ padding: '16px', color: '#666' }}>{subscription.period}</td>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: '#004A98' }}>{subscription.awardCost}</td>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: '#28a745' }}>{subscription.deliveredCost}</td>
                  <td style={{ padding: '16px', fontWeight: 'bold', 
                    color: parseFloat(subscription.remainingCost.replace(/[^0-9.]/g, '') || 0) > 0 ? '#dc3545' : '#28a745'
                  }}>
                    {subscription.remainingCost}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: 20,
                      background: getPaymentStatusColor(subscription.paymentStatus),
                      color: getPaymentStatusTextColor(subscription.paymentStatus),
                      fontSize: 12,
                      fontWeight: 500,
                      display: 'inline-block',
                    }}>
                      {subscription.paymentStatus}
                    </span>
                    {subscription.note && (
                      <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                        <MdOutlineInfo style={{ marginRight: 4 }} />
                        {subscription.note}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px', width: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#666' }}>
                        {subscription.progress}%
                      </span>
                      <ProgressBar progress={subscription.progress} />
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      onClick={() => handleViewDetails(subscription.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #004A98',
                        color: '#004A98',
                        padding: '8px 16px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#004A98';
                        e.target.style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#004A98';
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Rate and Footer */}
        <div style={{ 
          marginTop: 30, 
          paddingTop: 20, 
          borderTop: '1px solid #eee',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#004A98', fontSize: 18 }}>Payment Rate</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: paymentRate >= 90 ? '#28a745' : paymentRate >= 70 ? '#ffc107' : '#dc3545'
              }}>
                {paymentRate}%
              </div>
              <div style={{ width: 200 }}>
                <ProgressBar progress={paymentRate} />
              </div>
            </div>
          </div>
          
          <div style={{ color: '#666', fontSize: 14 }}>
            Showing {sortedSubscriptions.length} of {subscriptionData.length} results
          </div>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ 
              padding: '8px 16px', 
              border: '1px solid #ddd', 
              background: '#fff', 
              borderRadius: 6, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              Previous
            </button>
            <button style={{ 
              padding: '8px 16px', 
              border: '1px solid #004A98', 
              background: '#004A98', 
              color: '#fff', 
              borderRadius: 6, 
              cursor: 'pointer' 
            }}>
              1
            </button>
            <button style={{ 
              padding: '8px 16px', 
              border: '1px solid #ddd', 
              background: '#fff', 
              borderRadius: 6, 
              cursor: 'pointer' 
            }}>
              2
            </button>
            <button style={{ 
              padding: '8px 16px', 
              border: '1px solid #ddd', 
              background: '#fff', 
              borderRadius: 6, 
              cursor: 'pointer' 
            }}>
              3
            </button>
            <button style={{ 
              padding: '8px 16px', 
              border: '1px solid #ddd', 
              background: '#fff', 
              borderRadius: 6, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardTPUSubscriptionTracking() {
  return (
    <TPULayout title="Subscription Tracking">
      <SubscriptionTracking />
    </TPULayout>
  );
}