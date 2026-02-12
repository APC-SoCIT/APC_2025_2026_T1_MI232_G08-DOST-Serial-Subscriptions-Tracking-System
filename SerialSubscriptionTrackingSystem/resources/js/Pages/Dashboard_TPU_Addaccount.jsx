// resources/js/Pages/Dashboard_TPU_Addaccount.jsx
import React, { useState } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { HiUserAdd } from "react-icons/hi";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from 'axios';

function AddAccount() {
  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    password: '',
    password_confirmation: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Supplier name is required';
    }
    if (!formData.contact_person.trim()) {
      newErrors.contact_person = 'Contact person is required';
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
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setSubmitting(true);
      setErrors({}); // Clear previous errors
      
      try {
        const response = await axios.post('/api/supplier-accounts', formData);
        
        if (response.data.success) {
          // Reset form
          setFormData({
            company_name: '',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
            username: '',
            password: '',
            password_confirmation: '',
          });
          
          alert('Supplier account created successfully! Awaiting admin approval.');
        }
      } catch (error) {
        console.error('Error creating account:', error.response?.data || error);
        
        if (error.response?.status === 419) {
          // CSRF token expired - global interceptor should have retried but might still fail
          alert('Session expired. Please refresh the page and try again.');
        } else if (error.response?.status === 403) {
          alert('You do not have permission to create supplier accounts.');
        } else if (error.response?.data?.errors) {
          // Handle Laravel validation errors
          const serverErrors = {};
          Object.keys(error.response.data.errors).forEach(key => {
            serverErrors[key] = error.response.data.errors[key][0];
          });
          setErrors(serverErrors);
        } else if (error.response?.data?.message) {
          // Show the specific error message from the server
          alert(error.response.data.message);
        } else {
          alert('An error occurred while creating the account. Please try again.');
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 500,
    color: '#333',
  };

  const errorStyle = {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#fff' }}>
      {/* Create Account Form */}
      <div style={{ 
        width: '100%',
        background: '#fff', 
        padding: '32px 48px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <HiUserAdd style={{ fontSize: 28, color: '#004A98' }} />
          <h2 style={{ color: '#004A98', margin: 0, fontSize: 22 }}>Create Supplier Account</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Supplier Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Supplier Name <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              placeholder="Enter supplier name"
              style={{
                ...inputStyle,
                borderColor: errors.company_name ? '#dc3545' : '#ddd',
              }}
            />
            {errors.company_name && <p style={errorStyle}>{errors.company_name}</p>}
          </div>

          {/* Contact Person & Email Row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                Contact Person <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                placeholder="Enter contact person"
                style={{
                  ...inputStyle,
                  borderColor: errors.contact_person ? '#dc3545' : '#ddd',
                }}
              />
              {errors.contact_person && <p style={errorStyle}>{errors.contact_person}</p>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                Email Address <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                style={{
                  ...inputStyle,
                  borderColor: errors.email ? '#dc3545' : '#ddd',
                }}
              />
              {errors.email && <p style={errorStyle}>{errors.email}</p>}
            </div>
          </div>

          {/* Phone & Address Row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                Phone Number <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+63 XXX XXX XXXX"
                style={{
                  ...inputStyle,
                  borderColor: errors.phone ? '#dc3545' : '#ddd',
                }}
              />
              {errors.phone && <p style={errorStyle}>{errors.phone}</p>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                Address <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address"
                style={{
                  ...inputStyle,
                  borderColor: errors.address ? '#dc3545' : '#ddd',
                }}
              />
              {errors.address && <p style={errorStyle}>{errors.address}</p>}
            </div>
          </div>

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Username <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter username (min 4 characters)"
              style={{
                ...inputStyle,
                borderColor: errors.username ? '#dc3545' : '#ddd',
              }}
            />
            {errors.username && <p style={errorStyle}>{errors.username}</p>}
          </div>

          {/* Password & Confirm Password Row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                Password <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password (min 8 characters)"
                  style={{
                    ...inputStyle,
                    paddingRight: 40,
                    borderColor: errors.password ? '#dc3545' : '#ddd',
                  }}
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
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.password && <p style={errorStyle}>{errors.password}</p>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                Confirm Password <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  style={{
                    ...inputStyle,
                    paddingRight: 40,
                    borderColor: errors.password_confirmation ? '#dc3545' : '#ddd',
                  }}
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
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.password_confirmation && <p style={errorStyle}>{errors.password_confirmation}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              background: submitting ? '#6c9fd1' : '#004A98',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => !submitting && (e.target.style.background = '#003C7A')}
            onMouseOut={(e) => !submitting && (e.target.style.background = '#004A98')}
          >
            {submitting ? 'Creating...' : <><span style={{ fontSize: 18 }}>+</span> Create Account</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard_TPU_Addaccount() {
  return (
    <TPULayout title="Add Account">
      <AddAccount />
    </TPULayout>
  );
}
