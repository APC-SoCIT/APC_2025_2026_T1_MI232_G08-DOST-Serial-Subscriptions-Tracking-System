// resources/js/Pages/Dashboard_TPU_Supplierinfo.jsx
import React, { useState, useEffect } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { MdSearch, MdFilterList, MdAdd, MdClose, MdExpandMore } from "react-icons/md";
import { usePage } from '@inertiajs/react';
import axios from 'axios';

function SupplierInfo() {
  const { approvedSuppliers = [] } = usePage().props;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for Created Supplier Accounts section
  const [supplierAccounts, setSupplierAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountStatusFilter, setAccountStatusFilter] = useState('all');
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers' or 'accounts'

  // State for the selected supplier from dropdown
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [newSupplier, setNewSupplier] = useState({
    contactPerson: '',
    supplierName: '',
    email: '',
    phone: '',
    address: '',
    status: 'Active'
  });

  // Load suppliers from localStorage on mount, filtering out any that no longer exist in approved suppliers
  useEffect(() => {
    const savedSuppliers = localStorage.getItem('tpu_suppliers');
    if (savedSuppliers) {
      const parsed = JSON.parse(savedSuppliers);
      // Filter to only keep suppliers that still exist in approvedSuppliers (by email)
      const approvedEmails = approvedSuppliers.map(s => s.email?.toLowerCase());
      const validSuppliers = parsed.filter(s => approvedEmails.includes(s.email?.toLowerCase()));
      setSuppliers(validSuppliers);
      // Update localStorage if any were removed
      if (validSuppliers.length !== parsed.length) {
        if (validSuppliers.length > 0) {
          localStorage.setItem('tpu_suppliers', JSON.stringify(validSuppliers));
        } else {
          localStorage.removeItem('tpu_suppliers');
        }
      }
    }
  }, [approvedSuppliers]);

  // Fetch supplier accounts from API
  useEffect(() => {
    fetchSupplierAccounts();
  }, [accountStatusFilter]);

  const fetchSupplierAccounts = async () => {
    setAccountsLoading(true);
    try {
      const url = accountStatusFilter !== 'all' 
        ? `/api/supplier-accounts?status=${accountStatusFilter}` 
        : '/api/supplier-accounts';
      const response = await axios.get(url);
      if (response.data.success) {
        setSupplierAccounts(response.data.accounts);
      }
    } catch (error) {
      console.error('Error fetching supplier accounts:', error);
    } finally {
      setAccountsLoading(false);
    }
  };

  // Save suppliers to localStorage whenever they change
  useEffect(() => {
    if (suppliers.length > 0) {
      localStorage.setItem('tpu_suppliers', JSON.stringify(suppliers));
    }
  }, [suppliers]);

  // Filter out already added suppliers from the dropdown options
  const availableSuppliers = approvedSuppliers.filter(approved => {
    return !suppliers.some(s => s.email === approved.email);
  });

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setNewSupplier({
      contactPerson: supplier.contact_person || '',
      supplierName: supplier.company_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      status: 'Active'
    });
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create new supplier entry
    const supplierEntry = {
      id: Date.now(),
      contactPerson: newSupplier.contactPerson,
      supplierName: newSupplier.supplierName,
      email: newSupplier.email,
      phone: newSupplier.phone,
      address: newSupplier.address,
      status: newSupplier.status,
      addedAt: new Date().toISOString(),
      sourceAccountId: selectedSupplier?._id || selectedSupplier?.id || null,
    };

    setSuppliers(prev => [...prev, supplierEntry]);
    setSuccessMessage('Supplier added successfully!');
    
    // Reset form
    setShowAddSupplier(false);
    setSelectedSupplier(null);
    setNewSupplier({
      contactPerson: '',
      supplierName: '',
      email: '',
      phone: '',
      address: '',
      status: 'Active'
    });

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRemoveSupplier = (id) => {
    if (confirm('Are you sure you want to remove this supplier?')) {
      const updatedSuppliers = suppliers.filter(s => s.id !== id);
      setSuppliers(updatedSuppliers);
      if (updatedSuppliers.length === 0) {
        localStorage.removeItem('tpu_suppliers');
      }
    }
  };

  const handleToggleStatus = (id) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return s;
    }));
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || supplier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter supplier accounts
  const filteredAccounts = supplierAccounts.filter(account =>
    (account.company_name?.toLowerCase() || '').includes(accountSearchTerm.toLowerCase()) ||
    (account.contact_person?.toLowerCase() || '').includes(accountSearchTerm.toLowerCase()) ||
    (account.email?.toLowerCase() || '').includes(accountSearchTerm.toLowerCase()) ||
    (account.username?.toLowerCase() || '').includes(accountSearchTerm.toLowerCase())
  );

  const getAccountStatusBadge = (status) => {
    const statusStyles = {
      pending: { background: '#fff3cd', color: '#856404' },
      approved: { background: '#d4edda', color: '#155724' },
      rejected: { background: '#f8d7da', color: '#721c24' },
    };
    const style = statusStyles[status] || statusStyles.pending;
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        textTransform: 'capitalize',
        ...style,
      }}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#004A98', margin: 0 }}>Supplier Information</h2>
      </div>

      {successMessage && (
        <div style={{
          padding: '12px 16px',
          background: '#d4edda',
          color: '#155724',
          borderRadius: 6,
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {successMessage}
          <button 
            onClick={() => setSuccessMessage('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid #e0e0e0' }}>
        <button
          onClick={() => setActiveTab('suppliers')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'suppliers' ? '3px solid #004A98' : '3px solid transparent',
            color: activeTab === 'suppliers' ? '#004A98' : '#666',
            fontWeight: activeTab === 'suppliers' ? 600 : 400,
            fontSize: 14,
            cursor: 'pointer',
            marginBottom: -2,
            transition: 'all 0.2s',
          }}
        >
          Active Suppliers
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'accounts' ? '3px solid #004A98' : '3px solid transparent',
            color: activeTab === 'accounts' ? '#004A98' : '#666',
            fontWeight: activeTab === 'accounts' ? 600 : 400,
            fontSize: 14,
            cursor: 'pointer',
            marginBottom: -2,
            transition: 'all 0.2s',
          }}
        >
          Created Supplier Accounts
        </button>
      </div>

      {activeTab === 'suppliers' && (
      <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              borderRadius: 6,
              border: '1px solid #ddd',
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowAddSupplier(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: '#004A98',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              color: '#fff',
              fontWeight: 500,
            }}
          >
            <MdAdd size={18} /> Add Supplier
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFilter(!showFilter)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: '#f5f5f5',
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
                <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>Filter by Status</p>
                {['All', 'Active', 'Inactive'].map(status => (
                  <label key={status} style={{ display: 'block', marginBottom: 6, cursor: 'pointer' }}>
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
      </div>

      {/* Add Supplier Modal - Fullscreen */}
      {showAddSupplier && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 160,
          right: 0,
          bottom: 0,
          background: '#fff',
          zIndex: 1000,
          overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 40px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}>
            <h2 style={{ color: '#004A98', margin: 0, fontSize: 20, fontWeight: 600 }}>Supplier Information</h2>
            <button
              onClick={() => {
                setShowAddSupplier(false);
                setSelectedSupplier(null);
                setNewSupplier({
                  contactPerson: '',
                  supplierName: '',
                  email: '',
                  phone: '',
                  address: '',
                  status: 'Active'
                });
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: '#666',
                fontSize: 14,
              }}
            >
              <MdClose size={24} /> Close
            </button>
          </div>

          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '32px 40px',
          }}>
            <h3 style={{ color: '#333', margin: '0 0 24px 0', fontSize: 18 }}>Add New Supplier</h3>

            {/* Supplier Selection Dropdown */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                Select from Approved Suppliers <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    fontSize: 14,
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ color: selectedSupplier ? '#333' : '#999' }}>
                    {selectedSupplier 
                      ? `${selectedSupplier.company_name} - ${selectedSupplier.contact_person}`
                      : 'Click to select an approved supplier...'}
                  </span>
                  <MdExpandMore size={20} style={{ color: '#666', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>

                {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    maxHeight: 250,
                    overflowY: 'auto',
                    zIndex: 20,
                    marginTop: 4,
                  }}>
                    {availableSuppliers.length === 0 ? (
                      <div style={{ padding: 16, color: '#666', textAlign: 'center' }}>
                        {approvedSuppliers.length === 0 
                          ? 'No approved supplier accounts available. Please wait for admin approval.'
                          : 'All approved suppliers have been added.'}
                      </div>
                    ) : (
                      availableSuppliers.map((supplier) => (
                        <div
                          key={supplier._id || supplier.id}
                          onClick={() => handleSelectSupplier(supplier)}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                            background: selectedSupplier?._id === supplier._id ? '#f0f7ff' : '#fff',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.background = selectedSupplier?._id === supplier._id ? '#f0f7ff' : '#fff'}
                        >
                          <div style={{ fontWeight: 500, color: '#333' }}>{supplier.company_name}</div>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                            Contact: {supplier.contact_person} | {supplier.email}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <p style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                Select an approved supplier account to auto-fill the form below.
              </p>
            </div>

            {selectedSupplier && (
              <form onSubmit={handleSubmit}>
                <div style={{ 
                  padding: 16, 
                  background: '#f0f7ff', 
                  borderRadius: 8, 
                  marginBottom: 20,
                  border: '1px solid #cce0ff' 
                }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#004A98', fontWeight: 500 }}>
                    ✓ Supplier selected: {selectedSupplier.company_name}
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Contact Person <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={newSupplier.contactPerson}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter contact person name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 14,
                      background: '#f9f9f9',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Supplier Name <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="supplierName"
                    value={newSupplier.supplierName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter supplier/company name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 14,
                      background: '#f9f9f9',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Email <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newSupplier.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter email address"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 14,
                      background: '#f9f9f9',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Phone <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newSupplier.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., +63 912 345 6789"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 14,
                      background: '#f9f9f9',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Address <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={newSupplier.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter address"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 14,
                      background: '#f9f9f9',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={newSupplier.status}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 14,
                      background: '#fff',
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSupplier(false);
                      setSelectedSupplier(null);
                      setNewSupplier({
                        contactPerson: '',
                        supplierName: '',
                        email: '',
                        phone: '',
                        address: '',
                        status: 'Active'
                      });
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      background: '#004A98',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#fff',
                      fontWeight: 500,
                    }}
                  >
                    Add Supplier
                  </button>
                </div>
              </form>
            )}

            {!selectedSupplier && (
              <div style={{ 
                padding: 40, 
                textAlign: 'center', 
                color: '#666',
                background: '#f9f9f9',
                borderRadius: 8,
                border: '2px dashed #ddd'
              }}>
                <MdAdd size={48} style={{ color: '#ccc', marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 16 }}>Select an approved supplier from the dropdown above to continue.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Contact Person</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Supplier Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Phone</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Address</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSuppliers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px 16px', textAlign: 'center', color: '#666' }}>
                  {suppliers.length === 0 
                    ? 'No suppliers added yet. Click "Add Supplier" to add from approved accounts.'
                    : 'No suppliers match your search criteria.'}
                </td>
              </tr>
            ) : (
              paginatedSuppliers.map((supplier) => (
                <tr key={supplier.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 16px' }}>{supplier.contactPerson}</td>
                  <td style={{ padding: '12px 16px' }}>{supplier.supplierName}</td>
                  <td style={{ padding: '12px 16px', color: '#004A98' }}>{supplier.email}</td>
                  <td style={{ padding: '12px 16px' }}>{supplier.phone}</td>
                  <td style={{ padding: '12px 16px' }}>{supplier.address}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span 
                      onClick={() => handleToggleStatus(supplier.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: supplier.status === 'Active' ? '#d4edda' : '#f8d7da',
                        color: supplier.status === 'Active' ? '#155724' : '#721c24',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                      title="Click to toggle status"
                    >
                      {supplier.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleRemoveSupplier(supplier.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, color: '#666', fontSize: 14 }}>
        <div>
          Showing {paginatedSuppliers.length} of {filteredSuppliers.length} suppliers
          {filteredSuppliers.length !== suppliers.length && ` (filtered from ${suppliers.length} total)`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ 
              padding: '6px 12px', 
              border: '1px solid #ddd', 
              background: currentPage === 1 ? '#f5f5f5' : '#fff', 
              borderRadius: 4, 
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map(page => (
            <button 
              key={page}
              onClick={() => handlePageChange(page)}
              style={{ 
                padding: '6px 12px', 
                border: `1px solid ${currentPage === page ? '#004A98' : '#ddd'}`, 
                background: currentPage === page ? '#004A98' : '#fff', 
                color: currentPage === page ? '#fff' : '#333', 
                borderRadius: 4, 
                cursor: 'pointer' 
              }}
            >
              {page}
            </button>
          ))}
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || totalPages === 0}
            style={{ 
              padding: '6px 12px', 
              border: '1px solid #ddd', 
              background: currentPage >= totalPages ? '#f5f5f5' : '#fff', 
              borderRadius: 4, 
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage >= totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>
      </>
      )}

      {/* Created Supplier Accounts Tab */}
      {activeTab === 'accounts' && (
        <div>
          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <select
              value={accountStatusFilter}
              onChange={(e) => setAccountStatusFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #e0e0e0',
                fontSize: 14,
                outline: 'none',
                background: '#fff',
                minWidth: 140,
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div style={{ position: 'relative', flex: 1 }}>
              <MdSearch style={{ 
                position: 'absolute', 
                left: 12, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#999',
                fontSize: 18,
              }} />
              <input
                type="text"
                placeholder="Search accounts..."
                value={accountSearchTerm}
                onChange={(e) => setAccountSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 40px',
                  borderRadius: 8,
                  border: '1px solid #e0e0e0',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Accounts Table */}
          <div style={{ overflowX: 'auto' }}>
            {accountsLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                Loading accounts...
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Company</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Contact</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Username</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                        No supplier accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((account) => (
                      <tr key={account._id || account.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div>
                            <div style={{ fontWeight: 500, color: '#333', fontSize: 14 }}>{account.company_name}</div>
                            <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{account.email}</div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div>
                            <div style={{ color: '#333', fontSize: 14 }}>{account.contact_person}</div>
                            <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{account.phone}</div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 13, color: '#555' }}>
                          {account.username}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {getAccountStatusBadge(account.status)}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#555', fontSize: 13 }}>
                          {formatDate(account.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <p style={{ 
            marginTop: 16, 
            color: '#888', 
            fontSize: 13,
            textAlign: 'left',
          }}>
            Showing {filteredAccounts.length} of {supplierAccounts.length} accounts
          </p>
        </div>
      )}
    </div>
  );
}

export default function DashboardTPUSupplierInfo() {
  return (
    <TPULayout hideTitle={true}>
      <SupplierInfo />
    </TPULayout>
  );
}