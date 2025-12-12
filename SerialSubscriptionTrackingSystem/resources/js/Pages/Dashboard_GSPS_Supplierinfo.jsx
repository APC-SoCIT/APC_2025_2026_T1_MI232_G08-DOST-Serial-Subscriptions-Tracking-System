import React, { useState } from 'react';
import { GoHomeFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { ImStatsBars } from "react-icons/im";
import { FaTruck } from "react-icons/fa";
import { MdMarkEmailRead } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { RiAddLargeFill } from "react-icons/ri";
import { MdSearch, MdEdit, MdDelete, MdFilterList, MdFileDownload, MdPrint, MdEmail, MdPhone } from "react-icons/md";
import { FaMapMarkerAlt } from "react-icons/fa";

const Icon = ({ children }) => (
  <span style={{ marginRight: 8 }}>{children}</span>
);

const sidebarItems = [
  { icon: <GoHomeFill />, label: 'Dashboard' },
  { icon: <RiAddLargeFill />, label: 'Add Serial' },
  { icon: <HiUsers />, label: 'Supplier Info' },
  { icon: <ImStatsBars />, label: 'Subscription' },
  { icon: <FaTruck />, label: 'Monitor Delivery' },
  { icon: <MdMarkEmailRead />, label: 'Received' },
];

// Supplier Info Component for GSPS Role
function SupplierInfoGSPS() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  // Supplier data from your image
  const supplierData = [
    {
      id: 1,
      contactPerson: 'Maria Santos',
      supplierName: 'ABC Books Supplier',
      email: 'abcbooks@email.com',
      phone: '+63 912 345 6789',
      address: 'Makati City',
      status: 'Active',
      rating: 4.8,
      deliveryRate: '98%',
      totalOrders: 156,
      since: '2020',
      category: 'Books & Journals',
      notes: 'Reliable supplier for international publications'
    },
    {
      id: 2,
      contactPerson: 'Leo Cruz',
      supplierName: 'MedJournal Suppliers Inc.',
      email: 'medjournal@email.com',
      phone: '+63 912 345 7777',
      address: 'Pasig City',
      status: 'Active',
      rating: 4.5,
      deliveryRate: '95%',
      totalOrders: 89,
      since: '2021',
      category: 'Medical Journals',
      notes: 'Specializes in medical publications'
    },
    {
      id: 3,
      contactPerson: 'Leo Cruz',
      supplierName: 'Global Periodicals Co.',
      email: 'globalperiodic@gmail.com',
      phone: '+63 912 345 7777',
      address: 'Pasig City',
      status: 'Active',
      rating: 4.3,
      deliveryRate: '92%',
      totalOrders: 67,
      since: '2019',
      category: 'International Periodicals',
      notes: 'Global publications distributor'
    },
    {
      id: 4,
      contactPerson: 'J. Ramos',
      supplierName: 'EastAsia Books & Journals',
      email: 'eastasia@gmail.com',
      phone: '+63 945 567 8901',
      address: 'Manila City',
      status: 'Active',
      rating: 4.7,
      deliveryRate: '96%',
      totalOrders: 124,
      since: '2018',
      category: 'Asian Publications',
      notes: 'Focus on Asian economic and cultural publications'
    },
    {
      id: 5,
      contactPerson: 'K. Dela Rosa',
      supplierName: 'MedJournal Suppliers Inc.',
      email: 'medjournal@email.com',
      phone: '+63 956 678 9012',
      address: 'Makati City',
      status: 'Active',
      rating: 4.6,
      deliveryRate: '94%',
      totalOrders: 78,
      since: '2022',
      category: 'Medical Journals',
      notes: 'Branch office in Makati'
    },
  ];

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

  const handleEdit = (id) => {
    alert(`Edit supplier with ID: ${id} (GSPS role has view-only access)`);
  };

  const handleContact = (supplier) => {
    alert(`Contacting ${supplier.contactPerson} at ${supplier.supplierName}`);
  };

  const handleExport = () => {
    alert('Exporting supplier list for GSPS review...');
  };

  const handlePrint = () => {
    alert('Printing supplier information...');
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
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h2 style={{ color: '#004A98', margin: '0 0 8px 0', fontSize: 24 }}>Supplier Information</h2>
        <p style={{ color: '#666', margin: 0, fontSize: 16 }}>Manage and monitor all supplier details and performance</p>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Total Suppliers</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#004A98' }}>{supplierData.length}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Active Suppliers</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#28a745' }}>
            {supplierData.filter(s => s.status === 'Active').length}
          </p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Avg Delivery Rate</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#17a2b8' }}>95%</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Avg Rating</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#ffc107' }}>4.6/5</p>
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

            <button
              onClick={handleExport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <MdFileDownload /> Export
            </button>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <MdPrint /> Print
            </button>
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

function Sidebar({ active, setActive }) {
  return (
    <div style={{
      background: '#004A98',
      color: '#fff',
      width: 160,
      minHeight: '100vh',
      padding: '20px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <img
        src="/images/dost-logo1.png"
        alt="LOGO"
        style={{
          marginBottom: 24,
          width: 55,
          height: 55,
          borderRadius: 12
        }}
      />
      <nav style={{ width: '100%' }}>
        <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
          {sidebarItems.map((item, idx) => (
            <li
              key={item.label}
              style={{
                margin: '10px 0',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 500,
                color: '#fff',
                background: active === idx ? '#0062f4ff' : 'transparent',
                borderRadius: 6,
                padding: '8px 12px',
                width: '140px',
                marginLeft: '10px',
                transition: 'background 0.2s, transform 0.1s',
                boxShadow: active === idx ? '0 3px 6px rgba(0,0,0,0.15)' : 'none'
              }}
              onClick={() => setActive(idx)}
            >
              <Icon>{item.icon}</Icon>
              <span style={{ fontSize: 15 }}>{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function TopBar() {
  const [activeIcon, setActiveIcon] = useState(null);

  const handleIconClick = (icon) => {
    setActiveIcon(activeIcon === icon ? null : icon);
  };

  const popupStyle = {
    position: 'absolute',
    top: 60,
    right: 20,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
    padding: 16,
    width: 260,
    zIndex: 10,
  };

  return (
    <div
      style={{
        fontSize: 22,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 32px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 9
      }}
    >
      <h2 style={{ color: '#004A98', fontWeight: 600, fontSize: 20 }}>GSPS - Serial Subscription System</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
        <div style={{ fontSize: 14, color: '#666', background: '#f0f4f8', padding: '8px 16px', borderRadius: 20 }}>
          GSPS Role
        </div>

        <span onClick={() => handleIconClick('chat')} style={{ cursor: 'pointer' }}>
          <IoChatboxEllipsesOutline />
        </span>
        {activeIcon === 'chat' && (
          <div style={popupStyle}>
            <h4 style={{ margin: '0 0 8px' }}>Messages</h4>
            <p style={{ fontSize: 14, color: '#555' }}>No new messages.</p>
          </div>
        )}

        <span onClick={() => handleIconClick('notifications')} style={{ cursor: 'pointer' }}>
          <MdOutlineNotificationsActive />
        </span>
        {activeIcon === 'notifications' && (
          <div style={popupStyle}>
            <h4 style={{ margin: '0 0 8px' }}>Notifications</h4>
            <p style={{ fontSize: 14, color: '#555' }}>You're all caught up!</p>
          </div>
        )}

        <span onClick={() => handleIconClick('account')} style={{ cursor: 'pointer', position: 'relative' }}>
          <VscAccount size={22} />
          
          {activeIcon === 'account' && (
            <div
              style={{
                position: 'absolute',
                top: '35px',
                right: 0,
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                width: 200,
                padding: '16px 18px',
                zIndex: 100,
                transition: 'all 0.2s ease',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#004A98',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    marginRight: 10,
                  }}
                >
                  G
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, color: '#222' }}>GSPS User</h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#777' }}>Government Serial Procurement</p>
                </div>
              </div>

              <button
                style={{
                  width: '100%',
                  background: '#004A98',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 0',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'background 0.2s ease',
                }}
                onMouseOver={(e) => (e.target.style.background = '#003C7A')}
                onMouseOut={(e) => (e.target.style.background = '#004A98')}
              >
                Logout
              </button>
            </div>
          )}
        </span>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function App() {
  const [activeSidebar, setActiveSidebar] = useState(2); // Default to Supplier Info

  const renderContent = () => {
    switch (activeSidebar) {
      case 0: // Dashboard
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Dashboard Overview</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>{getGreeting()} Welcome back!</p>
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <h3>Dashboard View</h3>
              <p>Select other sidebar items to view different sections</p>
            </div>
          </>
        );
      case 2: // Supplier Info
        return (
          <>
            <SupplierInfoGSPS />
          </>
        );
      case 3: // Subscription Tracking
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Subscription Tracking</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Monitor and manage subscription payments</p>
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <h3>Subscription View</h3>
              <p>This would show your subscription tracking table</p>
            </div>
          </>
        );
      case 4: // Monitor Delivery
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Monitor Delivery</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Track and monitor all delivery activities</p>
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <h3>Monitor Delivery View</h3>
              <p>This would show your delivery monitoring table</p>
            </div>
          </>
        );
      case 5: // Received Items
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Received Items</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Track received serial items and inspection status</p>
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <h3>Received Items View</h3>
              <p>This would show your received items table</p>
            </div>
          </>
        );
      default:
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>{sidebarItems[activeSidebar].label}</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Content for {sidebarItems[activeSidebar].label} section</p>
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, color: '#666' }}>
              <h3>{sidebarItems[activeSidebar].label} View</h3>
              <p>This section is under development</p>
            </div>
          </>
        );
    }
  };

  return (
    <div style={{ display: 'flex', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f0f4f8', minHeight: '100vh' }}>
      <Sidebar active={activeSidebar} setActive={setActiveSidebar} />
      <div style={{ flex: 1 }}>
        <TopBar />
        <div style={{ padding: '32px 40px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;

console.log("GSPS Supplier Info loaded ✅");