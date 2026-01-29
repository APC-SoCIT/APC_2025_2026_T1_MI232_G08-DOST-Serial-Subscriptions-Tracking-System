// resources/js/Pages/Dashboard_TPU_Addaccount.jsx
import React, { useState } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { MdSearch, MdAdd, MdClose, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { FaUserPlus, FaCheck, FaTimes } from "react-icons/fa";

function AddAccount() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Sample created accounts list
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      companyName: 'ABC Books Supplier',
      contactPerson: 'Maria Santos',
      email: 'abcbooks@email.com',
      phone: '+63 912 345 6789',
      address: 'Makati City',
      username: 'abcbooks',
      status: 'Active',
      createdAt: '2025-12-15'
    },
    {
      id: 2,
      companyName: 'MedJournal Suppliers Inc.',
      contactPerson: 'Leo Cruz',
      email: 'medjournal@email.com',
      phone: '+63 912 345 7777',
      address: 'Pasig City',
      username: 'medjournal',
      status: 'Active',
      createdAt: '2025-12-20'
    },
    {
      id: 3,
      companyName: 'Global Periodicals Co.',
      contactPerson: 'Ana Reyes',
      email: 'globalperiodic@gmail.com',
      phone: '+63 923 456 7890',
      address: 'Quezon City',
      username: 'globalperiodic',
      status: 'Pending',
      createdAt: '2026-01-10'
    },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 4) {
      newErrors.username = 'Username must be at least 4 characters';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Create new account
    const newAccount = {
      id: accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1,
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      username: formData.username,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAccounts(prev => [...prev, newAccount]);
    
    // Reset form
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      username: '',
      password: '',
      confirmPassword: '',
    });

    setSuccessMessage('Supplier account created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const filteredAccounts = accounts.filter(account =>
    account.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 14,
    transition: 'border-color 0.2s',
    outline: 'none',
  };

  const inputErrorStyle = {
    ...inputStyle,
    border: '1px solid #dc3545',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontWeight: 500,
    color: '#333',
    fontSize: 14,
  };

  const errorTextStyle = {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: '#fff' }}>
      {/* Create Account Form */}
      <div style={{ 
        padding: 24, 
        flex: '1 1 400px',
        minWidth: 350,
        borderRight: '1px solid #e0e0e0',
        overflowY: 'auto',
        height: 'calc(100vh - 73px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <FaUserPlus size={24} color="#004A98" />
          <h2 style={{ color: '#004A98', margin: 0 }}>Create Supplier Account</h2>
        </div>

        {successMessage && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <FaCheck /> {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Company Name - Full Width */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Company Name *</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Enter company name"
              style={errors.companyName ? inputErrorStyle : inputStyle}
            />
            {errors.companyName && <p style={errorTextStyle}>{errors.companyName}</p>}
          </div>

          {/* Contact Person & Email - Side by Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Contact Person *</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                placeholder="Enter contact person"
                style={errors.contactPerson ? inputErrorStyle : inputStyle}
              />
              {errors.contactPerson && <p style={errorTextStyle}>{errors.contactPerson}</p>}
            </div>

            <div>
              <label style={labelStyle}>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                style={errors.email ? inputErrorStyle : inputStyle}
              />
              {errors.email && <p style={errorTextStyle}>{errors.email}</p>}
            </div>
          </div>

          {/* Phone & Address - Side by Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+63 XXX XXX XXXX"
                style={errors.phone ? inputErrorStyle : inputStyle}
              />
              {errors.phone && <p style={errorTextStyle}>{errors.phone}</p>}
            </div>

            <div>
              <label style={labelStyle}>Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address"
                style={errors.address ? inputErrorStyle : inputStyle}
              />
              {errors.address && <p style={errorTextStyle}>{errors.address}</p>}
            </div>
          </div>

          {/* Username - Full Width */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter username (min 4 characters)"
              style={errors.username ? inputErrorStyle : inputStyle}
            />
            {errors.username && <p style={errorTextStyle}>{errors.username}</p>}
          </div>

          {/* Password & Confirm Password - Side by Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password (min 8 characters)"
                  style={errors.password ? inputErrorStyle : inputStyle}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#666',
                  }}
                >
                  {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </span>
              </div>
              {errors.password && <p style={errorTextStyle}>{errors.password}</p>}
            </div>

            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  style={errors.confirmPassword ? inputErrorStyle : inputStyle}
                />
                <span
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#666',
                  }}
                >
                  {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </span>
              </div>
              {errors.confirmPassword && <p style={errorTextStyle}>{errors.confirmPassword}</p>}
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: 24,
              width: '100%',
              padding: '14px',
              background: '#004A98',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.target.style.background = '#003670'}
            onMouseOut={(e) => e.target.style.background = '#004A98'}
          >
            <MdAdd size={20} /> Create Account
          </button>
        </form>
      </div>

      {/* Created Accounts List */}
      <div style={{ 
        padding: 24, 
        flex: '1 1 500px',
        minWidth: 400,
        overflowY: 'auto',
        height: 'calc(100vh - 73px)',
      }}>
        <h2 style={{ color: '#004A98', marginTop: 0, marginBottom: 20 }}>Created Supplier Accounts</h2>
        
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input
            type="text"
            placeholder="Search accounts..."
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

        {/* Accounts Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: 13, color: '#495057' }}>Company</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: 13, color: '#495057' }}>Contact</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: 13, color: '#495057' }}>Username</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: 13, color: '#495057' }}>Status</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: 13, color: '#495057' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                    No accounts found
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px 8px', fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{account.companyName}</div>
                      <div style={{ color: '#666', fontSize: 12 }}>{account.email}</div>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 13 }}>
                      <div>{account.contactPerson}</div>
                      <div style={{ color: '#666', fontSize: 12 }}>{account.phone}</div>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 13, fontFamily: 'monospace' }}>
                      {account.username}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        background: account.status === 'Active' ? '#d4edda' : '#fff3cd',
                        color: account.status === 'Active' ? '#155724' : '#856404',
                      }}>
                        {account.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 13, color: '#666' }}>
                      {account.createdAt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, color: '#666', fontSize: 13 }}>
          Showing {filteredAccounts.length} of {accounts.length} accounts
        </div>
      </div>
    </div>
  );
}

// Export with TPULayout wrapper
export default function Dashboard_TPU_Addaccount() {
  return (
    <TPULayout title="Add Account">
      <AddAccount />
    </TPULayout>
  );
}
