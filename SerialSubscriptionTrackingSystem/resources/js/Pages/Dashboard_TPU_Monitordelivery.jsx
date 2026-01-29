import React, { useState } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { MdSearch, MdFilterList, MdRefresh } from "react-icons/md";

// Monitor Delivery Component
function MonitorDelivery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Delivery data from your image
  const deliveryData = [
    {
      id: 1,
      supplierName: 'ABC Books Supplier',
      contactPerson: 'Maria Santos',
      email: 'abcbooks@email.com',
      phone: '+63 912 345 6789',
      address: 'Makati City',
      status: 'Active',
      deliveryStatus: 'Delivered',
      expectedDate: '2024-01-15',
      deliveredDate: '2024-01-14',
      deliveryRate: '100%'
    },
    {
      id: 2,
      supplierName: 'MedJournal Suppliers Inc.',
      contactPerson: 'Leo Cruz',
      email: 'medjournal@email.com',
      phone: '+63 912 345 7777',
      address: 'Pasig City',
      status: 'Active',
      deliveryStatus: 'Pending',
      expectedDate: '2024-01-20',
      deliveredDate: '—',
      deliveryRate: '85%'
    },
    {
      id: 3,
      supplierName: 'Global Periodicals Co.',
      contactPerson: 'Leo Cruz',
      email: 'globalperiodic@gmail.com',
      phone: '+63 912 345 7777',
      address: 'Pasig City',
      status: 'Active',
      deliveryStatus: 'Delivered',
      expectedDate: '2024-01-10',
      deliveredDate: '2024-01-10',
      deliveryRate: '95%'
    },
    {
      id: 4,
      supplierName: 'EastAsia Books & Journals',
      contactPerson: 'J. Ramos',
      email: 'eastasia@gmail.com',
      phone: '+63 945 567 8901',
      address: 'Manila City',
      status: 'Active',
      deliveryStatus: 'Delayed',
      expectedDate: '2024-01-05',
      deliveredDate: '2024-01-07',
      deliveryRate: '90%'
    },
    {
      id: 5,
      supplierName: 'MedJournal Suppliers Inc.',
      contactPerson: 'K. Dela Rosa',
      email: 'medjournal@email.com',
      phone: '+63 956 678 9012',
      address: 'Makati City',
      status: 'Active',
      deliveryStatus: 'Delivered',
      expectedDate: '2024-01-18',
      deliveredDate: '2024-01-17',
      deliveryRate: '98%'
    },
  ];

  // Filter deliveries
  const filteredDeliveries = deliveryData.filter(delivery => {
    const matchesSearch = 
      delivery.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || delivery.deliveryStatus === statusFilter;
    
    const matchesDate = !dateFilter || delivery.expectedDate === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Stats calculation
  const totalExpected = 76;
  const totalDelivered = 71;
  const undelivered = 5;
  const deliveryRate = Math.round((totalDelivered / totalExpected) * 100);

  const stats = [
    { title: 'Total Expected', value: totalExpected, color: '#004A98' },
    { title: 'Total Delivered', value: totalDelivered, color: '#28a745' },
    { title: 'Undelivered', value: undelivered, color: '#dc3545' },
    { title: 'Delivery Rate', value: `${deliveryRate}%`, color: '#ffc107' },
  ];

  const getDeliveryStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return '#d4edda';
      case 'Pending': return '#fff3cd';
      case 'Delayed': return '#f8d7da';
      default: return '#e2e3e5';
    }
  };

  const getDeliveryStatusTextColor = (status) => {
    switch(status) {
      case 'Delivered': return '#155724';
      case 'Pending': return '#856404';
      case 'Delayed': return '#721c24';
      default: return '#383d41';
    }
  };

  const handleRefresh = () => {
    alert('Refreshing delivery data...');
  };

  return (
    <div style={{ background: '#fff', padding: 24, height: 'calc(100vh - 73px)', overflowY: 'auto' }}>
      {/* Main Content */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#004A98', margin: 0, fontSize: 20 }}>Delivery Monitoring</h2>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleRefresh}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                color: '#004A98',
              }}
            >
              <MdRefresh /> Refresh
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search deliveries..."
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
              <option value="Delayed">Delayed</option>
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
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Supplier Name</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Phone</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Address</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Delivery Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px' }}>{delivery.supplierName}</td>
                  <td style={{ padding: '16px' }}>{delivery.phone}</td>
                  <td style={{ padding: '16px' }}>{delivery.address}</td>
                  <td style={{ padding: '16px' }}>
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
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: delivery.status === 'Active' ? '#d4edda' : '#f8d7da',
                      color: delivery.status === 'Active' ? '#155724' : '#721c24',
                      fontSize: 12,
                      fontWeight: 500,
                    }}>
                      {delivery.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div style={{ 
          marginTop: 30, 
          paddingTop: 20, 
          borderTop: '1px solid #eee',
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center' 
        }}>
          <div style={{ color: '#666', fontSize: 14 }}>
            Showing {filteredDeliveries.length} of {deliveryData.length} results
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
  );
}

export default function DashboardTPUMonitorDelivery() {
  return (
    <TPULayout title="Monitor Delivery">
      <MonitorDelivery />
    </TPULayout>
  );
}