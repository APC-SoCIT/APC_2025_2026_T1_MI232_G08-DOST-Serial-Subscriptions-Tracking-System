import React, { useState, useRef } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { FaUserCircle, FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import { MdEmail, MdLock, MdWarning } from "react-icons/md";

export default function ProfilePage({ mustVerifyEmail, status }) {
  const user = usePage().props.auth.user;
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Profile form
  const profileForm = useForm({
    name: user.name,
    email: user.email,
  });

  // Password form
  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Delete form
  const deleteForm = useForm({
    password: '',
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    profileForm.patch(route('profile.update'), {
      onSuccess: () => setSuccessMessage('Profile updated successfully!'),
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    passwordForm.put(route('password.update'), {
      preserveScroll: true,
      onSuccess: () => {
        passwordForm.reset();
        setSuccessMessage('Password updated successfully!');
      },
    });
  };

  const handleDeleteAccount = (e) => {
    e.preventDefault();
    deleteForm.delete(route('profile.destroy'), {
      preserveScroll: true,
      onSuccess: () => setShowDeleteModal(false),
    });
  };

  const goBack = () => {
    const roleRoutes = {
      admin: '/dashboard-admin',
      supplier: '/dashboard-supplier',
      gsps: '/dashboard-gsps',
      tpu: '/dashboard-tpu',
      inspection: '/inspection-dashboard',
    };
    router.visit(roleRoutes[user.role] || '/dashboard');
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#fff',
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

  const tabStyle = (isActive) => ({
    padding: '12px 24px',
    background: isActive ? '#004A98' : 'transparent',
    color: isActive ? '#fff' : '#004A98',
    border: isActive ? 'none' : '1px solid #004A98',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <Head title="Profile" />
      
      {/* Header */}
      <div style={{
        background: '#004A98',
        color: '#fff',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <button
          onClick={goBack}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <FaUserCircle size={32} />
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{user.name}</h2>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.8, textTransform: 'capitalize' }}>{user.role}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Success Message */}
        {successMessage && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
            >×</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button style={tabStyle(activeTab === 'profile')} onClick={() => setActiveTab('profile')}>
            Profile Information
          </button>
          <button style={tabStyle(activeTab === 'password')} onClick={() => setActiveTab('password')}>
            Change Password
          </button>
          <button style={tabStyle(activeTab === 'danger')} onClick={() => setActiveTab('danger')}>
            Delete Account
          </button>
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <FaUserCircle size={24} color="#004A98" />
              <h3 style={{ margin: 0, color: '#004A98', fontSize: 20 }}>Profile Information</h3>
            </div>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
              Update your account's profile information and email address.
            </p>

            <form onSubmit={handleProfileSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  Full Name <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  value={profileForm.data.name}
                  onChange={(e) => profileForm.setData('name', e.target.value)}
                  style={{
                    ...inputStyle,
                    borderColor: profileForm.errors.name ? '#dc3545' : '#ddd',
                  }}
                  placeholder="Enter your full name"
                />
                {profileForm.errors.name && <p style={errorStyle}>{profileForm.errors.name}</p>}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  Email Address <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <MdEmail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                  <input
                    type="email"
                    value={profileForm.data.email}
                    onChange={(e) => profileForm.setData('email', e.target.value)}
                    style={{
                      ...inputStyle,
                      paddingLeft: 40,
                      borderColor: profileForm.errors.email ? '#dc3545' : '#ddd',
                    }}
                    placeholder="Enter your email address"
                  />
                </div>
                {profileForm.errors.email && <p style={errorStyle}>{profileForm.errors.email}</p>}
              </div>

              {mustVerifyEmail && user.email_verified_at === null && (
                <div style={{
                  background: '#fff3cd',
                  color: '#856404',
                  padding: '12px 16px',
                  borderRadius: 8,
                  marginBottom: 20,
                  fontSize: 14,
                }}>
                  Your email address is unverified. Please check your inbox for verification email.
                </div>
              )}

              <button
                type="submit"
                disabled={profileForm.processing}
                style={{
                  background: '#004A98',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: 8,
                  cursor: profileForm.processing ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  opacity: profileForm.processing ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {profileForm.processing ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <MdLock size={24} color="#004A98" />
              <h3 style={{ margin: 0, color: '#004A98', fontSize: 20 }}>Update Password</h3>
            </div>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
              Ensure your account is using a long, random password to stay secure.
              Password must be at least 8 characters and contain both letters and numbers.
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  Current Password <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.data.current_password}
                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      borderColor: passwordForm.errors.current_password ? '#dc3545' : '#ddd',
                    }}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#999',
                    }}
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordForm.errors.current_password && <p style={errorStyle}>{passwordForm.errors.current_password}</p>}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  New Password <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.data.password}
                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      borderColor: passwordForm.errors.password ? '#dc3545' : '#ddd',
                    }}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#999',
                    }}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordForm.errors.password && <p style={errorStyle}>{passwordForm.errors.password}</p>}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>
                  Confirm New Password <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.data.password_confirmation}
                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      borderColor: passwordForm.errors.password_confirmation ? '#dc3545' : '#ddd',
                    }}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#999',
                    }}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordForm.errors.password_confirmation && <p style={errorStyle}>{passwordForm.errors.password_confirmation}</p>}
              </div>

              <button
                type="submit"
                disabled={passwordForm.processing}
                style={{
                  background: '#004A98',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: 8,
                  cursor: passwordForm.processing ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  opacity: passwordForm.processing ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {passwordForm.processing ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Delete Account Tab */}
        {activeTab === 'danger' && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f5c6cb',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <MdWarning size={24} color="#dc3545" />
              <h3 style={{ margin: 0, color: '#dc3545', fontSize: 20 }}>Delete Account</h3>
            </div>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
              Once your account is deleted, all of its resources and data will be permanently deleted. 
              Before deleting your account, please download any data or information that you wish to retain.
            </p>

            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                padding: '12px 32px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.target.style.background = '#c82333'}
              onMouseOut={(e) => e.target.style.background = '#dc3545'}
            >
              Delete Account
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            maxWidth: 480,
            width: '90%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <MdWarning size={28} color="#dc3545" />
              <h3 style={{ margin: 0, color: '#dc3545', fontSize: 20 }}>Delete Account</h3>
            </div>
            
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
              Are you sure you want to delete your account? This action cannot be undone. 
              Please enter your password to confirm.
            </p>

            <form onSubmit={handleDeleteAccount}>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>
                  Password <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    value={deleteForm.data.password}
                    onChange={(e) => deleteForm.setData('password', e.target.value)}
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      borderColor: deleteForm.errors.password ? '#dc3545' : '#ddd',
                    }}
                    placeholder="Enter your password to confirm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#999',
                    }}
                  >
                    {showDeletePassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {deleteForm.errors.password && <p style={errorStyle}>{deleteForm.errors.password}</p>}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    deleteForm.reset();
                  }}
                  style={{
                    background: 'transparent',
                    color: '#666',
                    border: '1px solid #ddd',
                    padding: '10px 24px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteForm.processing}
                  style={{
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: 8,
                    cursor: deleteForm.processing ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                    opacity: deleteForm.processing ? 0.7 : 1,
                  }}
                >
                  {deleteForm.processing ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
