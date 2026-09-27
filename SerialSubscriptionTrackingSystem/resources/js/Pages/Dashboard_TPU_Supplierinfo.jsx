// resources/js/Pages/Dashboard_TPU_Supplierinfo.jsx
import React, { useState, useEffect } from 'react';
import TPULayout from '@/Layouts/TpuLayout';
import { MdSearch, MdAdd, MdClose, MdExpandMore } from "react-icons/md";
import { HiUserAdd } from "react-icons/hi";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'animate.css';

function SupplierInfo() {
  const { approvedSuppliers = [] } = usePage().props;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const itemsPerPage = 10;

  // State for Created Supplier Accounts section
  const [supplierAccounts, setSupplierAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountStatusFilter, setAccountStatusFilter] = useState('all');
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers' | 'accounts' | 'create'

  // State for the selected supplier from dropdown
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [newSupplier, setNewSupplier] = useState({
    contactPerson: '',
    supplierName: '',
    email: '',
    phone: '',
    address: '',
    status: 'Approved'
  });

  // ===== Create Supplier Account tab state (kept separate from the two
  // sections above, so nothing there is touched by this addition) =====
  const [createAccountFormData, setCreateAccountFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    password: '',
    password_confirmation: '',
  });
  const [createAccountShowPassword, setCreateAccountShowPassword] = useState(false);
  const [createAccountShowConfirmPassword, setCreateAccountShowConfirmPassword] = useState(false);
  const [createAccountErrors, setCreateAccountErrors] = useState({});
  const [createAccountSubmitting, setCreateAccountSubmitting] = useState(false);

  // Load Active Suppliers from the database — shared across every
  // browser/device/deployment, replacing the old localStorage-only list
  // that broke as soon as this app was opened from a fresh browser/deploy.
  const fetchActiveSuppliers = async () => {
    setSuppliersLoading(true);
    try {
      const response = await axios.get('/api/supplier-accounts/active');
      if (response.data.success) {
        const mapped = response.data.accounts.map((acc) => ({
          id: acc._id || acc.id,
          contactPerson: acc.contact_person || '',
          supplierName: acc.company_name || '',
          email: acc.email || '',
          phone: acc.phone || '',
          address: acc.address || '',
          status: 'Approved',
          sourceAccountId: acc._id || acc.id,
        }));
        setSuppliers(mapped);
      }
    } catch (error) {
      console.error('Error fetching active suppliers:', error);
    } finally {
      setSuppliersLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSuppliers();
  }, []);

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
      status: 'Approved'
    });
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const accountId = selectedSupplier?._id || selectedSupplier?.id;
    if (!accountId) return;

    try {
      const response = await axios.post(`/api/supplier-accounts/${accountId}/activate`);
      if (response.data.success) {
        setSuccessMessage('Supplier added successfully!');
        await fetchActiveSuppliers();

        // Reset form
        setShowAddSupplier(false);
        setSelectedSupplier(null);
        setNewSupplier({
          contactPerson: '',
          supplierName: '',
          email: '',
          phone: '',
          address: '',
          status: 'Approved'
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error adding active supplier:', error);
      Swal.fire({ title: error.response?.data?.message || 'Failed to add supplier. Please try again.', icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
    }
  };

  const handleRemoveSupplier = async (id) => {
    if (!confirm('Are you sure you want to remove this supplier?')) return;

    try {
      const response = await axios.post(`/api/supplier-accounts/${id}/deactivate`);
      if (response.data.success) {
        await fetchActiveSuppliers();
      }
    } catch (error) {
      console.error('Error removing active supplier:', error);
      Swal.fire({ title: 'Failed to remove supplier. Please try again.', icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
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

  // ===== Create Supplier Account tab handlers =====

  const handleCreateAccountInputChange = (e) => {
    const { name, value } = e.target;
    setCreateAccountFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (createAccountErrors[name]) {
      setCreateAccountErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCreateAccountPhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setCreateAccountFormData(prev => ({
      ...prev,
      phone: value
    }));
    if (createAccountErrors.phone) {
      setCreateAccountErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const validateCreateAccountForm = () => {
    const newErrors = {};

    if (!createAccountFormData.company_name.trim()) {
      newErrors.company_name = 'Supplier name is required';
    }
    if (!createAccountFormData.contact_person.trim()) {
      newErrors.contact_person = 'Contact person is required';
    }
    if (!createAccountFormData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(createAccountFormData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!createAccountFormData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const digitsOnly = createAccountFormData.phone.replace(/\D/g, '');
      if (digitsOnly.length !== 11) {
        newErrors.phone = 'Phone number must be exactly 11 digits';
      }
    }
    if (!createAccountFormData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!createAccountFormData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (createAccountFormData.username.length < 4) {
      newErrors.username = 'Username must be at least 4 characters';
    }
    if (!createAccountFormData.password) {
      newErrors.password = 'Password is required';
    } else if (createAccountFormData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(createAccountFormData.password)) {
      newErrors.password = 'Password must contain both letters and numbers';
    }
    if (!createAccountFormData.password_confirmation) {
      newErrors.password_confirmation = 'Please confirm your password';
    } else if (createAccountFormData.password !== createAccountFormData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }

    setCreateAccountErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccountSubmit = async (e) => {
    e.preventDefault();

    if (validateCreateAccountForm()) {
      setCreateAccountSubmitting(true);
      setCreateAccountErrors({});

      try {
        const response = await axios.post('/api/supplier-accounts', createAccountFormData);

        if (response.data.success) {
          // Reset form
          setCreateAccountFormData({
            company_name: '',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
            username: '',
            password: '',
            password_confirmation: '',
          });

          // Refresh Created Supplier Accounts list so the new account shows up immediately
          fetchSupplierAccounts();

          Swal.fire({
            title: "Supplier account created successfully! Awaiting admin approval.",
            icon: "success",
            confirmButtonColor: "#0062f4",
            showClass: {
              popup: `
                animate__animated
                animate__fadeInUp
                animate__faster
              `
            },
            hideClass: {
              popup: `
                animate__animated
                animate__fadeOutDown
                animate__faster
              `
            }
          });
        }
      } catch (error) {
        console.error('Error creating account:', error.response?.data || error);

        if (error.response?.status === 419) {
          Swal.fire({ title: 'Session expired. Please refresh the page and try again.', icon: 'warning', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        } else if (error.response?.status === 403) {
          Swal.fire({ title: 'You do not have permission to create supplier accounts.', icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        } else if (error.response?.data?.errors) {
          const serverErrors = {};
          Object.keys(error.response.data.errors).forEach(key => {
            serverErrors[key] = error.response.data.errors[key][0];
          });
          setCreateAccountErrors(serverErrors);
        } else if (error.response?.data?.message) {
          Swal.fire({ title: error.response.data.message, icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        } else {
          Swal.fire({ title: 'An error occurred while creating the account. Please try again.', icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        }
      } finally {
        setCreateAccountSubmitting(false);
      }
    }
  };

  const createAccountInputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const createAccountLabelStyle = {
    display: 'block',
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 500,
    color: '#333',
  };

  const createAccountErrorStyle = {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
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
        <button
          onClick={() => setActiveTab('create')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'create' ? '3px solid #004A98' : '3px solid transparent',
            color: activeTab === 'create' ? '#004A98' : '#666',
            fontWeight: activeTab === 'create' ? 600 : 400,
            fontSize: 14,
            cursor: 'pointer',
            marginBottom: -2,
            transition: 'all 0.2s',
          }}
        >
          Create Supplier Account
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
                  status: 'Approved'
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
                    type="text"
                    name="email"
                    value={newSupplier.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter email address"
                    autoComplete="email"
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

                <div style={{ marginBottom: 24 }}>
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

                {/* Status — fixed to Approved, not editable. Being added here
                    already means the account is an approved supplier. */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Status
                  </label>
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    fontSize: 14,
                    background: '#f0f7ff',
                    color: '#004A98',
                    fontWeight: 500,
                  }}>
                    Approved
                  </div>
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
                        status: 'Approved'
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
            <tr style={{ background: 'linear-gradient(90deg, #004A98, #0062f4)', color: '#fff' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Contact Person</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Supplier Name</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Email</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Phone</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Address</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliersLoading ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px 16px', textAlign: 'center', color: '#666' }}>
                  Loading active suppliers...
                </td>
              </tr>
            ) : paginatedSuppliers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px 16px', textAlign: 'center', color: '#666' }}>
                  {suppliers.length === 0 
                    ? 'No suppliers added yet. Click "Add Supplier" to add from approved accounts.'
                    : 'No suppliers match your search criteria.'}
                </td>
              </tr>
            ) : (
              paginatedSuppliers.map((supplier, index) => (
                <tr key={supplier.id} style={{ borderBottom: '1px solid #eee', background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ padding: '12px 16px' }}>{supplier.contactPerson}</td>
                  <td style={{ padding: '12px 16px' }}>{supplier.supplierName}</td>
                  <td style={{ padding: '12px 16px', color: '#004A98' }}>{supplier.email}</td>
                  <td style={{ padding: '12px 16px' }}>{supplier.phone}</td>
                  <td style={{ padding: '12px 16px' }}>{supplier.address}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {/* Fixed, non-interactive — being listed here already means Active */}
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: '#d4edda',
                      color: '#155724',
                      fontSize: 12,
                      fontWeight: 500,
                    }}>
                      Active
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
                  <tr style={{ background: 'linear-gradient(90deg, #004A98, #0062f4)', color: '#fff' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Company</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Contact</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Username</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Status</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Created</th>
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
                    filteredAccounts.map((account, index) => (
                      <tr key={account._id || account.id} style={{ borderBottom: '1px solid #eee', background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
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

      {/* Create Supplier Account Tab */}
      {activeTab === 'create' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <HiUserAdd style={{ fontSize: 28, color: '#004A98' }} />
            <h3 style={{ color: '#004A98', margin: 0, fontSize: 20 }}>Create Supplier Account</h3>
          </div>

          <form onSubmit={handleCreateAccountSubmit}>
            {/* Supplier Name - full width */}
            <div style={{ marginBottom: 16 }}>
              <label style={createAccountLabelStyle}>
                Supplier Name <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={createAccountFormData.company_name}
                onChange={handleCreateAccountInputChange}
                placeholder="Enter supplier name"
                style={{
                  ...createAccountInputStyle,
                  borderColor: createAccountErrors.company_name ? '#dc3545' : '#ddd',
                }}
              />
              {createAccountErrors.company_name && <p style={createAccountErrorStyle}>{createAccountErrors.company_name}</p>}
            </div>

            {/* Contact Person & Email Row */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={createAccountLabelStyle}>
                  Contact Person <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="contact_person"
                  value={createAccountFormData.contact_person}
                  onChange={handleCreateAccountInputChange}
                  placeholder="Enter contact person"
                  style={{
                    ...createAccountInputStyle,
                    borderColor: createAccountErrors.contact_person ? '#dc3545' : '#ddd',
                  }}
                />
                {createAccountErrors.contact_person && <p style={createAccountErrorStyle}>{createAccountErrors.contact_person}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={createAccountLabelStyle}>
                  Email Address <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="email"
                  value={createAccountFormData.email}
                  onChange={handleCreateAccountInputChange}
                  placeholder="Enter email address"
                  autoComplete="email"
                  style={{
                    ...createAccountInputStyle,
                    borderColor: createAccountErrors.email ? '#dc3545' : '#ddd',
                  }}
                />
                {createAccountErrors.email && <p style={createAccountErrorStyle}>{createAccountErrors.email}</p>}
              </div>
            </div>

            {/* Phone & Address Row */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={createAccountLabelStyle}>
                  Phone Number <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={createAccountFormData.phone}
                  onChange={handleCreateAccountPhoneChange}
                  placeholder="09XXXXXXXXX"
                  maxLength={11}
                  style={{
                    ...createAccountInputStyle,
                    borderColor: createAccountErrors.phone ? '#dc3545' : '#ddd',
                  }}
                />
                {createAccountErrors.phone && <p style={createAccountErrorStyle}>{createAccountErrors.phone}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={createAccountLabelStyle}>
                  Address <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={createAccountFormData.address}
                  onChange={handleCreateAccountInputChange}
                  placeholder="Enter address"
                  style={{
                    ...createAccountInputStyle,
                    borderColor: createAccountErrors.address ? '#dc3545' : '#ddd',
                  }}
                />
                {createAccountErrors.address && <p style={createAccountErrorStyle}>{createAccountErrors.address}</p>}
              </div>
            </div>

            {/* Username - full width */}
            <div style={{ marginBottom: 16 }}>
              <label style={createAccountLabelStyle}>
                Username <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="username"
                value={createAccountFormData.username}
                onChange={handleCreateAccountInputChange}
                placeholder="Enter username (min 4 characters)"
                style={{
                  ...createAccountInputStyle,
                  borderColor: createAccountErrors.username ? '#dc3545' : '#ddd',
                }}
              />
              {createAccountErrors.username && <p style={createAccountErrorStyle}>{createAccountErrors.username}</p>}
            </div>

            {/* Password & Confirm Password Row */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <label style={createAccountLabelStyle}>
                  Password <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={createAccountShowPassword ? 'text' : 'password'}
                    name="password"
                    value={createAccountFormData.password}
                    onChange={handleCreateAccountInputChange}
                    placeholder="Enter password (min 8 characters)"
                    style={{
                      ...createAccountInputStyle,
                      paddingRight: 40,
                      borderColor: createAccountErrors.password ? '#dc3545' : '#ddd',
                    }}
                  />
                  <span
                    onClick={() => setCreateAccountShowPassword(!createAccountShowPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: '#666',
                    }}
                  >
                    {createAccountShowPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {createAccountErrors.password && <p style={createAccountErrorStyle}>{createAccountErrors.password}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={createAccountLabelStyle}>
                  Confirm Password <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={createAccountShowConfirmPassword ? 'text' : 'password'}
                    name="password_confirmation"
                    value={createAccountFormData.password_confirmation}
                    onChange={handleCreateAccountInputChange}
                    placeholder="Confirm password"
                    style={{
                      ...createAccountInputStyle,
                      paddingRight: 40,
                      borderColor: createAccountErrors.password_confirmation ? '#dc3545' : '#ddd',
                    }}
                  />
                  <span
                    onClick={() => setCreateAccountShowConfirmPassword(!createAccountShowConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: '#666',
                    }}
                  >
                    {createAccountShowConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {createAccountErrors.password_confirmation && <p style={createAccountErrorStyle}>{createAccountErrors.password_confirmation}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={createAccountSubmitting}
              style={{
                width: '100%',
                padding: '14px',
                background: createAccountSubmitting ? '#6c9fd1' : '#004A98',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: createAccountSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => !createAccountSubmitting && (e.target.style.background = '#003C7A')}
              onMouseOut={(e) => !createAccountSubmitting && (e.target.style.background = '#004A98')}
            >
              {createAccountSubmitting ? 'Creating...' : <><span style={{ fontSize: 18 }}>+</span> Create Account</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function DashboardTPUSupplierInfo() {
  return (
    <TPULayout title="Supplier Info">
          <SupplierInfo />
        </TPULayout>
  );
}