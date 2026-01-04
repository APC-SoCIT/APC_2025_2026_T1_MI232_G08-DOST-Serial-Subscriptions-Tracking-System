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
      notes: 'Reliable supplier for international publications'
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
      notes: 'Specializes in medical publications'
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
      notes: 'Global publications distributor'
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
      notes: 'Focus on Asian economic and cultural publications'
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
      notes: 'Branch office in Makati'
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
    setSelectedSupplier(supplier);
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
          <span style={{ fontWeight: 500 }}>Rating: </span>
          {supplier.rating}/5
        </div>
        <div>
          <span style={{ fontWeight: 500 }}>Delivery: </span>
          {supplier.deliveryRate}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 120px)' }}>
      {/* Stats Overview - Updated to match your image */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Total Suppliers</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#004A98' }}>{supplierData.length}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Active Suppliers</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#28a745' }}>
            {activeSuppliers}
          </p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Avg Delivery Rate</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#17a2b8' }}>95%</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Avg Rating</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#ffc107' }}>{avgRating}/5</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
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
                  <tr key={supplier.id} style={{ borderBottom: '1px solid #eee' }}>
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
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleContact(supplier)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #004A98',
                            color: '#004A98',
                            padding: '6px 12px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                          }}
                        >
                          <MdEmail /> Contact
                        </button>
                        <button
                          onClick={() => handleViewDetails(supplier)}
                          style={{
                            background: '#004A98',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 13,
                          }}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Card View */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: 20,
            marginBottom: 30
          }}>
            {filteredSuppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        )}

        {/* Supplier Details Panel */}
        {selectedSupplier && (
          <div style={{
            marginTop: 30,
            padding: 24,
            background: '#f8f9fa',
            borderRadius: 12,
            border: '1px solid #ddd',
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
                    <strong style={{ color: '#666', fontSize: 14 }}>Rating:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{selectedSupplier.rating}/5</p>
                  </div>
                  <div>
                    <strong style={{ color: '#666', fontSize: 14 }}>Delivery Rate:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{selectedSupplier.deliveryRate}</p>
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

        {/* Table Footer */}
        <div style={{ 
          marginTop: selectedSupplier ? 20 : 30,
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