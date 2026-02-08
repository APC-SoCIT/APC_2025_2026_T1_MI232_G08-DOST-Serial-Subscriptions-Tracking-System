import React, { useState, useEffect } from 'react';
import GSPSLayout from '@/Layouts/GSPSLayout';
import { MdSearch, MdFilterList, MdEmail, MdPhone } from "react-icons/md";
import { FaMapMarkerAlt } from "react-icons/fa";
import axios from 'axios';

// Supplier Info Component for GSPS Role
function SupplierInfoGSPS() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  
  // Dynamic data states
  const [supplierData, setSupplierData] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch approved suppliers and subscriptions in parallel
      const [suppliersRes, subscriptionsRes] = await Promise.all([
        axios.get('/api/supplier-accounts/approved'),
        axios.get('/api/subscriptions')
      ]);

      if (suppliersRes.data.success) {
        // Transform supplier accounts to match display format
        const suppliers = suppliersRes.data.accounts.map(acc => ({
          id: acc._id || acc.id,
          contactPerson: acc.contact_person || 'N/A',
          supplierName: acc.company_name,
          email: acc.email,
          phone: acc.phone || 'N/A',
          address: acc.address || 'N/A',
          status: 'Active',
          rating: 4.5,
          deliveryRate: '95%',
          totalOrders: 0,
          since: new Date(acc.approved_at || acc.created_at).getFullYear().toString(),
          category: 'General',
          notes: '',
          ongoingSerials: [],
        }));
        setSupplierData(suppliers);
      }

      if (subscriptionsRes.data.success) {
        setSubscriptions(subscriptionsRes.data.subscriptions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get serials for a specific supplier from subscriptions
  const getSerialsForSupplier = (supplierName) => {
    const supplierSubscriptions = subscriptions.filter(
      sub => sub.supplier_name?.toLowerCase() === supplierName?.toLowerCase()
    );
    
    // Flatten all serials from subscriptions
    const serials = [];
    supplierSubscriptions.forEach(sub => {
      if (sub.serials && sub.serials.length > 0) {
        sub.serials.forEach(serial => {
          serials.push({
            id: serial.id,
            title: serial.title || sub.serial_title,
            issn: serial.issn || 'N/A',
            frequency: serial.frequency || 'N/A',
            status: serial.status || 'Pending',
            nextIssue: serial.deliveryDate || null,
            subscriptionPeriod: sub.period,
            awardCost: sub.award_cost,
          });
        });
      } else {
        // If no serials array, create one from the subscription itself
        serials.push({
          id: sub._id || sub.id,
          title: sub.serial_title,
          issn: 'N/A',
          frequency: 'N/A',
          status: sub.status || 'Active',
          nextIssue: null,
          subscriptionPeriod: sub.period,
          awardCost: sub.award_cost,
        });
      }
    });
    
    return serials;
  };

  // Get subscription stats for a supplier
  const getSupplierStats = (supplierName) => {
    const supplierSubscriptions = subscriptions.filter(
      sub => sub.supplier_name?.toLowerCase() === supplierName?.toLowerCase()
    );
    
    return {
      totalOrders: supplierSubscriptions.length,
      totalValue: supplierSubscriptions.reduce((sum, sub) => sum + (parseFloat(sub.award_cost) || 0), 0),
    };
  };

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

  const handleViewDetails = (supplier) => {
    // Toggle off if clicking the same supplier
    if (selectedSupplier?.id === supplier.id) {
      setSelectedSupplier(null);
    } else {
      setSelectedSupplier(supplier);
    }
  };

  // Supplier Details Panel Component
  const SupplierDetailsPanel = ({ supplier, onClose }) => {
    const supplierSerials = getSerialsForSupplier(supplier.supplierName);
    const stats = getSupplierStats(supplier.supplierName);
    
    return (
    <div style={{
      padding: 24,
      background: '#f8f9fa',
      borderTop: '1px solid #e5e7eb',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', color: '#004A98', fontSize: 20 }}>{supplier.supplierName}</h3>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Supplier Details</p>
        </div>
        <button
          onClick={onClose}
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
              <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{supplier.contactPerson}</p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: 14 }}>Email:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: 16, color: '#004A98' }}>{supplier.email}</p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: 14 }}>Phone:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{supplier.phone}</p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: 14 }}>Address:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{supplier.address}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: 16 }}>Subscription Summary</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <strong style={{ color: '#666', fontSize: 14 }}>Status:</strong>
              <span style={{
                padding: '4px 12px',
                borderRadius: 20,
                background: supplier.status === 'Active' ? '#d1fae5' : '#fee2e2',
                color: supplier.status === 'Active' ? '#065f46' : '#991b1b',
                fontSize: 12,
                fontWeight: 500,
                marginLeft: 8
              }}>
                {supplier.status}
              </span>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: 14 }}>Total Subscriptions:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{stats.totalOrders}</p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: 14 }}>Total Value:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: 16, color: '#004A98', fontWeight: 600 }}>P{stats.totalValue.toLocaleString()}</p>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: 14 }}>Total Serials:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{supplierSerials.length}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: 16 }}>Additional Information</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <strong style={{ color: '#666', fontSize: 14 }}>Member Since:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: 16 }}>{supplier.since}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ongoing Serials Section */}
      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#333', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          Subscribed Serials
          <span style={{
            background: '#004A98',
            color: '#fff',
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
          }}>
            {supplierSerials.length}
          </span>
        </h4>
        
        {supplierSerials.length > 0 ? (
          <div style={{ 
            background: '#fff', 
            borderRadius: 8, 
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>ISSN</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Frequency</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Period</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {supplierSerials.map((serial, index) => (
                  <tr 
                    key={serial.id || index} 
                    style={{ 
                      borderBottom: index !== supplierSerials.length - 1 ? '1px solid #e5e7eb' : 'none',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#1f2937', fontWeight: 500 }}>
                      {serial.title}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280', fontFamily: 'monospace' }}>
                      {serial.issn}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#4b5563' }}>
                      {serial.frequency}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#4b5563' }}>
                      {serial.subscriptionPeriod || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 16,
                        background: serial.status === 'Active' || serial.status === 'Delivered' ? '#d1fae5' : '#fef3c7',
                        color: serial.status === 'Active' || serial.status === 'Delivered' ? '#065f46' : '#92400e',
                        fontSize: 12,
                        fontWeight: 500,
                      }}>
                        {serial.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            padding: 24, 
            textAlign: 'center', 
            color: '#6b7280', 
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            No subscriptions found for this supplier.
          </div>
        )}
      </div>
    </div>
  );
  };

  const SupplierCard = ({ supplier }) => (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: selectedSupplier?.id === supplier.id ? '2px solid #004A98' : '1px solid #e5e7eb',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }} onClick={() => handleViewDetails(supplier)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#004A98',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: 16,
          }}>
            {supplier.contactPerson.charAt(0)}
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#1f2937', fontSize: 16, fontWeight: 600 }}>{supplier.supplierName}</h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>{supplier.contactPerson}</p>
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: 20,
          background: supplier.status === 'Active' ? '#d1fae5' : '#fee2e2',
          color: supplier.status === 'Active' ? '#065f46' : '#991b1b',
          fontSize: 12,
          fontWeight: 500,
        }}>
          {supplier.status}
        </span>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <MdEmail style={{ color: '#9ca3af', fontSize: 16 }} />
          <a href={`mailto:${supplier.email}`} style={{ fontSize: 14, color: '#004A98', textDecoration: 'none' }}>{supplier.email}</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <MdPhone style={{ color: '#9ca3af', fontSize: 16 }} />
          <span style={{ fontSize: 14, color: '#4b5563' }}>{supplier.phone}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaMapMarkerAlt style={{ color: '#9ca3af', fontSize: 14 }} />
          <span style={{ fontSize: 14, color: '#4b5563' }}>{supplier.address}</span>
        </div>
      </div>
      
      <div style={{ paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails(supplier);
          }}
          style={{
            width: '100%',
            background: '#004A98',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#fff', minHeight: 'calc(100vh - 73px)', padding: '24px 32px' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#004A98', margin: '0 0 4px 0', fontSize: 24, fontWeight: 600 }}>Supplier Directory</h2>
          <p style={{ color: '#666', margin: 0, fontSize: 14 }}>View supplier information and their subscriptions</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#004A98',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 500,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          
          {/* View Toggle */}
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #ddd' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '10px 20px',
                background: viewMode === 'table' ? '#004A98' : '#fff',
                color: viewMode === 'table' ? '#fff' : '#666',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('card')}
              style={{
                padding: '10px 20px',
                background: viewMode === 'card' ? '#004A98' : '#fff',
                color: viewMode === 'card' ? '#fff' : '#666',
                border: 'none',
                borderLeft: '1px solid #ddd',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
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
          <MdSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: 20 }} />
          <input
            type="text"
            placeholder="Search suppliers by name, contact, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 14px 14px 44px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 14,
              outline: 'none',
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
              padding: '14px 20px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              color: '#333',
            }}
          >
            <MdFilterList style={{ fontSize: 18 }} /> Filter
          </button>
          
          {showFilter && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              padding: 16,
              width: 200,
              zIndex: 10,
              marginTop: 8,
            }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: 600, fontSize: 14, color: '#333' }}>Filter by Status</p>
              {['All', 'Active', 'Inactive'].map(status => (
                <label key={status} style={{ display: 'block', marginBottom: 10, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="radio"
                    checked={statusFilter === status}
                    onChange={() => {
                      setStatusFilter(status);
                      setShowFilter(false);
                    }}
                    style={{ marginRight: 10 }}
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
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 14 }}>Contact Person</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 14 }}>Supplier Name</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 14 }}>Email</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 14 }}>Phone</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 14 }}>Address</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 14 }}>Status</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 14 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                    Loading suppliers...
                  </td>
                </tr>
              )}
              {!loading && filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                    No suppliers found. Suppliers will appear here after TPU creates and admin approves them.
                  </td>
                </tr>
              )}
              {!loading && filteredSuppliers.map((supplier, index) => (
                <React.Fragment key={supplier.id}>
                  <tr 
                    style={{ 
                      borderBottom: selectedSupplier?.id === supplier.id ? 'none' : '1px solid #e5e7eb',
                      background: selectedSupplier?.id === supplier.id ? '#f0f7ff' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: '#004A98',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: 16,
                        }}>
                          {supplier.contactPerson.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 500, color: '#1f2937', fontSize: 14 }}>{supplier.contactPerson}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#1f2937', fontSize: 14 }}>{supplier.supplierName}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <a href={`mailto:${supplier.email}`} style={{ color: '#004A98', textDecoration: 'none', fontSize: 14 }}>
                        {supplier.email}
                      </a>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#4b5563', fontSize: 14 }}>{supplier.phone}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4b5563', fontSize: 14 }}>
                        <FaMapMarkerAlt style={{ color: '#9ca3af', fontSize: 12 }} />
                        {supplier.address}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '6px 16px',
                        borderRadius: 20,
                        background: supplier.status === 'Active' ? '#d1fae5' : '#fee2e2',
                        color: supplier.status === 'Active' ? '#065f46' : '#991b1b',
                        fontSize: 13,
                        fontWeight: 500,
                        display: 'inline-block',
                      }}>
                        {supplier.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button
                        onClick={() => handleViewDetails(supplier)}
                        style={{
                          background: selectedSupplier?.id === supplier.id ? '#dc3545' : '#004A98',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 20px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {selectedSupplier?.id === supplier.id ? 'Close' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {/* Details Panel Row - shown right below the selected supplier */}
                  {selectedSupplier?.id === supplier.id && (
                    <tr>
                      <td colSpan="7" style={{ padding: 0, borderBottom: '1px solid #e5e7eb' }}>
                        <SupplierDetailsPanel supplier={supplier} onClose={() => setSelectedSupplier(null)} />
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
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            marginBottom: 30
          }}>
            {loading && (
              <div style={{ padding: '48px', textAlign: 'center', color: '#666', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                Loading suppliers...
              </div>
            )}
            {!loading && filteredSuppliers.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: '#666', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                No suppliers found. Suppliers will appear here after TPU creates and admin approves them.
              </div>
            )}
            {!loading && filteredSuppliers.map((supplier) => (
              <div key={supplier.id}>
                <SupplierCard supplier={supplier} />
                {/* Details Panel - shown right below the selected card */}
                {selectedSupplier?.id === supplier.id && (
                  <div style={{ 
                    marginTop: -1,
                    background: '#f8f9fa',
                    borderRadius: '0 0 12px 12px',
                    border: '1px solid #e5e7eb',
                    borderTop: 'none',
                  }}>
                    <SupplierDetailsPanel supplier={supplier} onClose={() => setSelectedSupplier(null)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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