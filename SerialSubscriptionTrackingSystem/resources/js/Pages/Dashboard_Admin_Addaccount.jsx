// resources/js/Pages/Dashboard_Admin_Addaccount.jsx
import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { HiUserAdd } from "react-icons/hi";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from 'axios';

const ROLES = [
  { value: 'tpu', label: 'TPU (Technical Processing Unit)' },
  { value: 'gsps', label: 'GSPS (General Services & Procurement Section)' },
  { value: 'inspection', label: 'Inspection' },
];

function AddAccount() {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
    password_confirmation: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    // Clear success message when editing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain both letters and numbers';
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
      setErrors({});
      setSuccessMessage('');
      
      try {
        const response = await axios.post('/api/users', formData);
        
        if (response.data.success) {
          // Reset form
          setFormData({
            name: '',
            email: '',
            role: '',
            password: '',
            password_confirmation: '',
          });
          
          const roleLabel = ROLES.find(r => r.value === formData.role)?.label || formData.role;
          setSuccessMessage(`User account created successfully! Role: ${roleLabel}`);
        }
      } catch (error) {
        console.error('Error creating account:', error.response?.data || error);
        
        if (error.response?.status === 419) {
          alert('Session expired. Please refresh the page and try again.');
        } else if (error.response?.status === 403) {
          alert('You do not have permission to create user accounts.');
        } else if (error.response?.data?.errors) {
          const serverErrors = {};
          Object.keys(error.response.data.errors).forEach(key => {
            serverErrors[key] = error.response.data.errors[key][0];
          });
          setErrors(serverErrors);
        } else if (error.response?.data?.message) {
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
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <HiUserAdd style={{ fontSize: 28, color: '#004A98' }} />
          <h2 style={{ color: '#004A98', margin: 0, fontSize: 22 }}>Create Staff Account</h2>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            color: '#155724',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14,
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Full Name <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter full name"
              style={{
                ...inputStyle,
                borderColor: errors.name ? '#dc3545' : '#ddd',
              }}
            />
            {errors.name && <p style={errorStyle}>{errors.name}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
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

          {/* Role Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Role <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              style={{
                ...inputStyle,
                borderColor: errors.role ? '#dc3545' : '#ddd',
                cursor: 'pointer',
                background: '#fff',
              }}
            >
              <option value="">Select a role</option>
              {ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            {errors.role && <p style={errorStyle}>{errors.role}</p>}
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
                  placeholder="Enter password (min 8 characters, alphanumeric)"
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

export default function Dashboard_Admin_Addaccount() {
  return (
    <AdminLayout title="Add Account">
      <AddAccount />
    </AdminLayout>
  );
}
