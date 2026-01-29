import React, { useState } from 'react';
import GSPSLayout from '@/Layouts/GSPSLayout';
import { MdSearch, MdFilterList, MdEmail, MdPhone } from "react-icons/md";
import { FaMapMarkerAlt } from "react-icons/fa";

// Supplier Info Component for GSPS Role
function SupplierInfoGSPS() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  // Updated supplier data to match your image exactly
  const supplierData = [
    {
      id: 1,
      contactPerson: 'Marie Santos',
      supplierName: 'ABC Books Supplier',
      email: 'abcbooks@email.com',
      phone: '+63 912 345 6789',
      address: 'Makati City',
      status: 'Active',
      rating: 4.6,
      deliveryRate: '95%',
      totalOrders: 156,
      since: '2020',
      category: 'Books & Journals',
      notes: 'Reliable supplier for international publications',
      ongoingSerials: [
        { id: 1, title: 'Nature', volumeIssue: 'Vol 3 Issue 12', status: 'In Transit', expectedDelivery: '2026-02-05' },
        { id: 2, title: 'Science Weekly', volumeIssue: 'Vol 8 Issue 4', status: 'Processing', expectedDelivery: '2026-02-12' },
        { id: 3, title: 'Research Quarterly', volumeIssue: 'Vol 15 Issue 1', status: 'Confirmed', expectedDelivery: '2026-02-20' },
      ]
    },
    {
      id: 2,
      contactPerson: 'Lee Cruz',
      supplierName: 'MedJournal Suppliers Inc.',
      email: 'medjournal@email.com',
      phone: '+63 912 345 7777',
      address: 'Pasig City',
      status: 'Active',
      rating: 4.6,
      deliveryRate: '95%',
      totalOrders: 89,
      since: '2021',
      category: 'Medical Journals',
      notes: 'Specializes in medical publications',
      ongoingSerials: [
        { id: 4, title: 'The Lancet', volumeIssue: 'Vol 1 Issue 12', status: 'In Transit', expectedDelivery: '2026-02-03' },
        { id: 5, title: 'Medical Research Today', volumeIssue: 'Vol 22 Issue 2', status: 'Processing', expectedDelivery: '2026-02-15' },
      ]
    },
    {
      id: 3,
      contactPerson: 'Lee Cruz',
      supplierName: 'Global Periodicals Co.',
      email: 'globalperiodic@gmail.com',
      phone: '+63 912 345 7777',
      address: 'Pasig City',
      status: 'Active',
      rating: 4.6,
      deliveryRate: '95%',
      totalOrders: 67,
      since: '2019',
      category: 'International Periodicals',
      notes: 'Global publications distributor',
      ongoingSerials: [
        { id: 6, title: 'World Economics Review', volumeIssue: 'Vol 5 Issue 3', status: 'Confirmed', expectedDelivery: '2026-02-08' },
        { id: 7, title: 'Global Science Digest', volumeIssue: 'Vol 12 Issue 1', status: 'In Transit', expectedDelivery: '2026-02-01' },
        { id: 8, title: 'International Affairs Quarterly', volumeIssue: 'Vol 9 Issue 4', status: 'Processing', expectedDelivery: '2026-02-18' },
        { id: 9, title: 'Tech Innovation Weekly', volumeIssue: 'Vol 3 Issue 8', status: 'Confirmed', expectedDelivery: '2026-02-25' },
      ]
    },
    {
      id: 4,
      contactPerson: 'Julian Esmora',
      supplierName: 'EastAsia Books & Journals',
      email: 'eastasia@gmail.com',
      phone: '+63 945 567 8901',
      address: 'Makati City',
      status: 'Active',
      rating: 4.6,
      deliveryRate: '95%',
      totalOrders: 124,
      since: '2018',
      category: 'Asian Publications',
      notes: 'Focus on Asian economic and cultural publications',
      ongoingSerials: [
        { id: 10, title: 'Asian Economic Review', volumeIssue: 'Vol 18 Issue 2', status: 'In Transit', expectedDelivery: '2026-02-06' },
        { id: 11, title: 'East Asia Studies', volumeIssue: 'Vol 7 Issue 1', status: 'Confirmed', expectedDelivery: '2026-02-14' },
      ]
    },
    {
      id: 5,
      contactPerson: 'Kian Dois Rosa',
      supplierName: 'MedJournal Suppliers Inc.',
      email: 'medjournal@email.com',
      phone: '+63 956 678 9012',
      address: 'Makati City',
      status: 'Active',
      rating: 4.6,
      deliveryRate: '95%',
      totalOrders: 78,
      since: '2022',
      category: 'Medical Journals',
      notes: 'Branch office in Makati',
      ongoingSerials: [
        { id: 12, title: 'Clinical Medicine Journal', volumeIssue: 'Vol 4 Issue 6', status: 'Processing', expectedDelivery: '2026-02-10' },
      ]
    },
  ];

  // Calculate average rating and delivery rate
  const avgRating = (supplierData.reduce((sum, supplier) => sum + supplier.rating, 0) / supplierData.length).toFixed(1);
  const activeSuppliers = supplierData.filter(s => s.status === 'Active').length;

  // Filter suppliers
  const filteredSuppliers = supplierData.filter(supplier => {
    const matchesSearch = 
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || supplier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleContact = (supplier) => {
    alert(`Contacting ${supplier.contactPerson} at ${supplier.supplierName}`);
  };

  const handleViewDetails = (supplier) => {
    // Toggle: if clicking the same supplier, close the panel; otherwise open new one
    if (selectedSupplier?.id === supplier.id) {
      setSelectedSupplier(null);
    } else {
      setSelectedSupplier(supplier);
    }
  };

  const SupplierCard = ({ supplier }) => (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: selectedSupplier?.id === supplier.id ? '2px solid #004A98' : '1px solid #e0e0e0',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }} onClick={() => handleViewDetails(supplier)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', color: '#004A98', fontSize: 18 }}>{supplier.supplierName}</h3>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{supplier.contactPerson}</p>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: 20,
          background: supplier.status === 'Active' ? '#d4edda' : '#f8d7da',
          color: supplier.status === 'Active' ? '#155724' : '#721c24',
          fontSize: 12,
          fontWeight: 500,
        }}>
          {supplier.status}
        </span>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <MdEmail style={{ color: '#666', fontSize: 14 }} />
          <span style={{ fontSize: 14, color: '#444' }}>{supplier.email}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <MdPhone style={{ color: '#666', fontSize: 14 }} />
          <span style={{ fontSize: 14, color: '#444' }}>{supplier.phone}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaMapMarkerAlt style={{ color: '#666', fontSize: 14 }} />
          <span style={{ fontSize: 14, color: '#444' }}>{supplier.address}</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
        <div>
          <span style={{ fontWeight: 500 }}>Total Orders: </span>
          {supplier.totalOrders}
        </div>
        <div>
          <span style={{ fontWeight: 500 }}>Since: </span>
          {supplier.since}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#fff', minHeight: 'calc(100vh - 73px)', height: '100%', overflow: 'auto' }}>
      {/* Main Content Card */}
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ color: '#004A98', margin: '0 0 8px 0', fontSize: 20 }}>Supplier Directory</h2>
            <p style={{ color: '#666', margin: 0, fontSize: 14 }}>View and manage supplier information</p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* View Toggle */}
            <div style={{ display: 'flex', background: '#f8f9fa', borderRadius: 6, padding: 4 }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'table' ? '#004A98' : 'transparent',
                  color: viewMode === 'table' ? '#fff' : '#666',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('card')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'card' ? '#004A98' : 'transparent',
                  color: viewMode === 'card' ? '#fff' : '#666',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Card View
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search suppliers by name, contact, or address..."
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
                width: 200,
                zIndex: 10,
                marginTop: 8,
              }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 500, fontSize: 14 }}>Filter by Status</p>
                {['All', 'Active', 'Inactive'].map(status => (
                  <label key={status} style={{ display: 'block', marginBottom: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="radio"
                      checked={statusFilter === status}
                      onChange={() => {
                        setStatusFilter(status);
                        setShowFilter(false);
                      }}
                      style={{ marginRight: 8 }}
                    />
                    {status}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd', fontSize: 14 }}>Contact Person</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd', fontSize: 14 }}>Supplier Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd', fontSize: 14 }}>Email</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd', fontSize: 14 }}>Phone</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd', fontSize: 14 }}>Address</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd', fontSize: 14 }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd', fontSize: 14 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <React.Fragment key={supplier.id}>
                    <tr style={{ borderBottom: selectedSupplier?.id === supplier.id ? 'none' : '1px solid #eee' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#004A98',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: 14,
                          }}>
                            {supplier.contactPerson.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 500 }}>{supplier.contactPerson}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontWeight: 500 }}>{supplier.supplierName}</td>
                      <td style={{ padding: '16px', color: '#004A98' }}>{supplier.email}</td>
                      <td style={{ padding: '16px' }}>{supplier.phone}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FaMapMarkerAlt style={{ color: '#666', fontSize: 12 }} />
                          {supplier.address}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '6px 16px',
                          borderRadius: 20,
                          background: supplier.status === 'Active' ? '#d4edda' : '#f8d7da',
                          color: supplier.status === 'Active' ? '#155724' : '#721c24',
                          fontSize: 12,
                          fontWeight: 500,
                        }}>
                          {supplier.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => handleViewDetails(supplier)}
                          style={{
                            background: selectedSupplier?.id === supplier.id ? '#dc3545' : '#004A98',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 13,
                          }}
                        >
                          {selectedSupplier?.id === supplier.id ? 'Close' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {/* Inline Ongoing Serials Panel */}
                    {selectedSupplier?.id === supplier.id && (
                      <tr>
                        <td colSpan="7" style={{ padding: 0, background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                          <div style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                              <div>
                                <h4 style={{ margin: '0 0 4px 0', color: '#004A98', fontSize: 16 }}>Ongoing Serials</h4>
                                <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{supplier.ongoingSerials?.length || 0} active subscriptions</p>
                              </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
                              <thead>
                                <tr style={{ background: '#e9ecef' }}>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13 }}>Serial Title</th>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13 }}>Volume/Issue</th>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13 }}>Status</th>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13 }}>Expected Delivery</th>
                                </tr>
                              </thead>
                              <tbody>
                                {supplier.ongoingSerials && supplier.ongoingSerials.length > 0 ? (
                                  supplier.ongoingSerials.map((serial) => (
                                    <tr key={serial.id} style={{ borderBottom: '1px solid #eee' }}>
                                      <td style={{ padding: '12px 14px', fontWeight: 500, fontSize: 13 }}>{serial.title}</td>
                                      <td style={{ padding: '12px 14px', color: '#666', fontSize: 13 }}>{serial.volumeIssue}</td>
                                      <td style={{ padding: '12px 14px' }}>
                                        <span style={{
                                          padding: '3px 10px',
                                          borderRadius: 12,
                                          background: serial.status === 'In Transit' ? '#fff3cd' : serial.status === 'Processing' ? '#cce5ff' : '#d4edda',
                                          color: serial.status === 'In Transit' ? '#856404' : serial.status === 'Processing' ? '#004085' : '#155724',
                                          fontSize: 11,
                                          fontWeight: 500,
                                        }}>
                                          {serial.status}
                                        </span>
                                      </td>
                                      <td style={{ padding: '12px 14px', color: '#666', fontSize: 13 }}>
                                        {new Date(serial.expectedDelivery).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="4" style={{ padding: '16px 14px', textAlign: 'center', color: '#666', fontSize: 13 }}>
                                      No ongoing serials for this supplier
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Card View */
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: 20,
              marginBottom: selectedSupplier ? 20 : 30
            }}>
              {filteredSuppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>

            {/* Supplier Details Panel for Card View */}
            {selectedSupplier && (
              <div style={{
                padding: 24,
                background: '#f8f9fa',
                borderRadius: 12,
                border: '1px solid #ddd',
                marginBottom: 30,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#004A98', fontSize: 20 }}>{selectedSupplier.supplierName}</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Supplier Details</p>
                  </div>
                  <button
                    onClick={() => setSelectedSupplier(null)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #dc3545',
                      color: '#dc3545',
                      padding: '8px 16px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    Close
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: 16 }}>Contact Information</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <strong style={{ color: '#666', fontSize: 14 }}>Contact Person:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{selectedSupplier.contactPerson}</p>
                      </div>
                      <div>
                        <strong style={{ color: '#666', fontSize: 14 }}>Email:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: 16, color: '#004A98' }}>{selectedSupplier.email}</p>
                      </div>
                      <div>
                        <strong style={{ color: '#666', fontSize: 14 }}>Phone:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{selectedSupplier.phone}</p>
                      </div>
                      <div>
                        <strong style={{ color: '#666', fontSize: 14 }}>Address:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{selectedSupplier.address}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: 16 }}>Performance Metrics</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <strong style={{ color: '#666', fontSize: 14 }}>Status:</strong>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          background: selectedSupplier.status === 'Active' ? '#d4edda' : '#f8d7da',
                          color: selectedSupplier.status === 'Active' ? '#155724' : '#721c24',
                          fontSize: 12,
                          fontWeight: 500,
                          marginLeft: 8
                        }}>
                          {selectedSupplier.status}
                        </span>
                      </div>
                      <div>
                        <strong style={{ color: '#666', fontSize: 14 }}>Total Orders:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{selectedSupplier.totalOrders}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: 16 }}>Additional Information</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <strong style={{ color: '#666', fontSize: 14 }}>Category:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{selectedSupplier.category}</p>
                      </div>
                      <div>
                        <strong style={{ color: '#666', fontSize: 14 }}>Since:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{selectedSupplier.since}</p>
                      </div>
                      <div>
                        <strong style={{ color: '#666', fontSize: 14 }}>Notes:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#666' }}>{selectedSupplier.notes}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Table Footer */}
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
            Showing {filteredSuppliers.length} of {supplierData.length} suppliers
          </div>
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

export default function DashboardGSPSSupplierInfo() {
  return (
    <GSPSLayout title="Supplier Information">
      <SupplierInfoGSPS />
    </GSPSLayout>
  );
}