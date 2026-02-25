import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import GSPSLayout from '@/Layouts/GSPSLayout';
import { MdSearch, MdFilterList, MdCloudUpload, MdClose, MdImage, MdVisibility } from "react-icons/md";
import { FaHistory } from "react-icons/fa";
import Swal from 'sweetalert2';
import 'animate.css';
import ProcessMovementHistory from "@/Components/ProcessMovementHistory";

// Delivery Status Component - MATCHING YOUR IMAGE EXACTLY
function DeliveryStatus() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, item: null });
  
  // Attachment state for image upload
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Re-upload state for view modal
  const [reuploadFile, setReuploadFile] = useState(null);
  const [reuploadPreview, setReuploadPreview] = useState(null);
  const [reuploadUploading, setReuploadUploading] = useState(false);
  const reuploadFileInputRef = useRef(null);
  
  // API data state
  const [deliveryData, setDeliveryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Process movement history modal
  const [historyModal, setHistoryModal] = useState({ open: false, serial: null });
  // View modal state
  const [viewModal, setViewModal] = useState({ show: false, item: null });

  // Fetch delivery serials from API
  useEffect(() => {
    fetchDeliverySerials();
  }, []);

  const fetchDeliverySerials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/subscriptions/delivery-serials');
      
      if (response.data.success) {
        setDeliveryData(response.data.serials || []);
      }
    } catch (err) {
      console.error('Error fetching delivery serials:', err);
      setError('Failed to load delivery data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's an image or PDF
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({ title: 'Please select an image (JPG, PNG) or PDF file', icon: 'warning', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        return;
      }
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({ title: 'File size must be less than 10MB', icon: 'warning', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        return;
      }
      setAttachmentFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove attachment
  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Close modal and reset attachment
  const handleCloseConfirmModal = () => {
    setConfirmModal({ show: false, item: null });
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  // Handle confirm receipt
  const handleConfirmReceipt = async () => {
    if (!confirmModal.item) return;
    
    // Require attachment
    if (!attachmentFile) {
      Swal.fire({ title: 'Please upload an image of the received serial before confirming.', icon: 'warning', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
      return;
    }
    
    setUploading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('serial_issn', confirmModal.item.issn);
      formData.append('attachment', attachmentFile);
      
      const response = await axios.post(
        `/api/subscriptions/${confirmModal.item.subscription_id}/serial-received`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        // Update local state with received date and attachment
        setDeliveryData(prev => prev.map(item => 
          item.id === confirmModal.item.id 
            ? { 
                ...item, 
                status: 'received', 
                receivedDate: response.data.receivedDate,
                attachmentUrl: response.data.attachmentUrl 
              }
            : item
        ));
        handleCloseConfirmModal();
      } else {
        Swal.fire({ title: 'Failed to confirm receipt. Please try again.', icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
      }
    } catch (err) {
      console.error('Error confirming receipt:', err);
      Swal.fire({ title: 'Failed to confirm receipt. Please try again.', icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
    } finally {
      setUploading(false);
    }
  };

  // Handle re-upload file selection in view modal
  const handleReuploadFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({ title: 'Please select an image (JPG, PNG) or PDF file', icon: 'warning', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({ title: 'File size must be less than 10MB', icon: 'warning', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        return;
      }
      setReuploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReuploadPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle re-upload submission
  const handleReuploadSubmit = async () => {
    if (!reuploadFile || !viewModal.item) return;

    setReuploadUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('serial_issn', viewModal.item.issn);
      formData.append('attachment', reuploadFile);
      
      const response = await axios.post(
        `/api/subscriptions/${viewModal.item.subscription_id}/update-attachment`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        // Update local state with new attachment URL
        setDeliveryData(prev => prev.map(item => 
          item.id === viewModal.item.id 
            ? { ...item, attachmentUrl: response.data.attachmentUrl }
            : item
        ));
        // Update view modal with new attachment
        setViewModal(prev => ({
          ...prev,
          item: { ...prev.item, attachmentUrl: response.data.attachmentUrl }
        }));
        // Reset re-upload state
        setReuploadFile(null);
        setReuploadPreview(null);
        Swal.fire({ title: 'Image updated successfully!', icon: 'success', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
      } else {
        Swal.fire({ title: 'Failed to update image. Please try again.', icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
      }
    } catch (err) {
      console.error('Error updating attachment:', err);
      Swal.fire({ title: 'Failed to update image. Please try again.', icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
    } finally {
      setReuploadUploading(false);
    }
  };

  // Close view modal and reset re-upload state
  const handleCloseViewModal = () => {
    setViewModal({ show: false, item: null });
    setReuploadFile(null);
    setReuploadPreview(null);
  };

  // Filter data
  const filteredData = deliveryData.filter(item => {
    const matchesSearch = 
      (item.serialTitle && item.serialTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      filter === 'All' || 
      (filter === 'Received' && item.status === 'received') ||
      (filter === 'For Delivery' && item.status === 'for_delivery');
    
    return matchesSearch && matchesFilter;
  });

  // Calculate totals
  const totalForDelivery = deliveryData.filter(item => item.status === 'for_delivery').length;
  const totalReceived = deliveryData.filter(item => item.status === 'received').length;
  const totalItems = deliveryData.length;

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 120px)' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Total Deliveries</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#004A98' }}>{totalItems}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>For Delivery</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#17a2b8' }}>{totalForDelivery}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Received</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#28a745' }}>{totalReceived}</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ color: '#004A98', margin: '0 0 8px 0', fontSize: 20 }}>Delivery Tracking</h2>
            <p style={{ color: '#666', margin: 0, fontSize: 14 }}>Current status of all serial deliveries</p>
          </div>
          <button
            onClick={fetchDeliverySerials}
            disabled={loading}
            style={{
              background: '#004A98',
              border: 'none',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 500,
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search serial title or supplier..."
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
                width: 180,
                zIndex: 10,
                marginTop: 8,
              }}>
                <p style={{ margin: '0 0 12px 0', fontWeight: 500, fontSize: 14 }}>Filter Status</p>
                {['All', 'For Delivery', 'Received'].map(option => (
                  <label key={option} style={{ display: 'block', marginBottom: 10, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="radio"
                      checked={filter === option}
                      onChange={() => {
                        setFilter(option);
                        setShowFilter(false);
                      }}
                      style={{ marginRight: 8 }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table - EXACTLY LIKE YOUR IMAGE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                background: 'linear-gradient(90deg, #004A98, #0062f4)',
                color: '#fff'
              }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Serial Title</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Supplier Name</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Delivery Date</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Confirmation</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Received Date</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    Loading delivery data...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
                    {error}
                    <button 
                      onClick={fetchDeliverySerials}
                      style={{ marginLeft: 16, padding: '8px 16px', background: '#004A98', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr 
                    key={item.id} 
                    style={{ 
                      borderBottom: '1px solid #eee',
                      background: index % 2 === 0 ? '#fff' : '#f9f9f9'
                    }}
                  >
                    <td style={{ padding: '16px', fontWeight: 500 }}>{item.serialTitle}</td>
                    <td style={{ padding: '16px' }}>{item.supplierName}</td>
                    <td style={{ 
                      padding: '16px', 
                      textAlign: 'center',
                      color: '#555'
                    }}>
                      {item.deliveryDate 
                        ? new Date(item.deliveryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '-'
                      }
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {item.status === 'received' ? (
                        <span
                          style={{
                            padding: '8px 20px',
                            borderRadius: 20,
                            background: '#28a745',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Received
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ show: true, item: item })}
                          style={{
                            padding: '8px 20px',
                            borderRadius: 6,
                            border: 'none',
                            background: '#004A98',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => e.target.style.background = '#003875'}
                          onMouseOut={(e) => e.target.style.background = '#004A98'}
                        >
                          Confirm
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#555' }}>
                      {item.receivedDate 
                        ? new Date(item.receivedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '-'
                      }
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          onClick={() => setViewModal({ show: true, item: item })}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #17a2b8',
                            background: '#f8f9fa',
                            color: '#17a2b8',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#17a2b8'; e.currentTarget.style.color = '#fff'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = '#17a2b8'; }}
                          title="View Serial Details"
                        >
                          <MdVisibility size={14} /> View
                        </button>
                        <button
                          onClick={() => setHistoryModal({ open: true, serial: item })}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #004A98',
                            background: '#f8f9fa',
                            color: '#004A98',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#004A98'; e.currentTarget.style.color = '#fff'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = '#004A98'; }}
                          title="View Process Movement History"
                        >
                          <FaHistory size={12} /> History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    {searchTerm ? `No deliveries found matching "${searchTerm}"` : 'No deliveries awaiting confirmation yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div style={{ 
          marginTop: 30,
          paddingTop: 20,
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          color: '#666',
          fontSize: 14
        }}>
          <div>
            Showing {filteredData.length} of {deliveryData.length} deliveries
            {filter !== 'All' && ` (${filter} only)`}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={handleCloseConfirmModal}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          `}</style>
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '32px 40px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
              maxWidth: 500,
              width: '90%',
              animation: 'slideIn 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 20, color: '#222' }}>
              Confirm Receipt
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: 15, color: '#666' }}>
              Upload an image of the received serial to confirm delivery.
            </p>
            {confirmModal.item && (
              <p style={{ margin: '0 0 20px', fontSize: 14, color: '#004A98', fontWeight: 600 }}>
                "{confirmModal.item.serialTitle}" from {confirmModal.item.supplierName}
              </p>
            )}
            
            {/* Image Upload Section */}
            <div style={{ marginBottom: 24 }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                style={{ display: 'none' }}
              />
              
              {!attachmentPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #ddd',
                    borderRadius: 8,
                    padding: '30px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: '#f9f9f9',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#004A98';
                    e.currentTarget.style.background = '#f0f4f8';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#ddd';
                    e.currentTarget.style.background = '#f9f9f9';
                  }}
                >
                  <MdCloudUpload size={40} color="#004A98" />
                  <p style={{ margin: '10px 0 5px', fontSize: 14, color: '#333', fontWeight: 500 }}>
                    Click to upload image or PDF
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
                    JPG, PNG, PDF (max 10MB)
                  </p>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img
                    src={attachmentPreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      borderRadius: 8,
                      border: '1px solid #ddd',
                    }}
                  />
                  <button
                    onClick={handleRemoveAttachment}
                    style={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MdClose size={18} />
                  </button>
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: '#28a745', fontWeight: 500 }}>
                    <MdImage style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {attachmentFile?.name}
                  </p>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={handleConfirmReceipt}
                disabled={uploading || !attachmentFile}
                style={{
                  padding: '10px 32px',
                  borderRadius: 6,
                  border: 'none',
                  background: uploading || !attachmentFile ? '#ccc' : '#28a745',
                  color: '#fff',
                  cursor: uploading || !attachmentFile ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseOver={(e) => {
                  if (!uploading && attachmentFile) e.target.style.background = '#218838';
                }}
                onMouseOut={(e) => {
                  if (!uploading && attachmentFile) e.target.style.background = '#28a745';
                }}
              >
                {uploading ? 'Uploading...' : 'Confirm Receipt'}
              </button>
              <button
                onClick={handleCloseConfirmModal}
                disabled={uploading}
                style={{
                  padding: '10px 32px',
                  borderRadius: 6,
                  border: '1px solid #dc3545',
                  background: '#fff',
                  color: '#dc3545',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  opacity: uploading ? 0.6 : 1,
                }}
                onMouseOver={(e) => { 
                  if (!uploading) {
                    e.target.style.background = '#dc3545'; 
                    e.target.style.color = '#fff'; 
                  }
                }}
                onMouseOut={(e) => { 
                  e.target.style.background = '#fff'; 
                  e.target.style.color = '#dc3545'; 
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Serial Details Modal */}
      {viewModal.show && viewModal.item && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setViewModal({ show: false, item: null })}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          `}</style>
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '32px 40px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              maxWidth: 600,
              width: '90%',
              maxHeight: '85vh',
              overflow: 'auto',
              animation: 'slideIn 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, color: '#004A98' }}>Serial Details</h3>
              <button
                onClick={() => setViewModal({ show: false, item: null })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <MdClose size={24} color="#666" />
              </button>
            </div>

            {/* Serial Information */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 16, color: '#333', borderBottom: '2px solid #004A98', paddingBottom: 8 }}>
                {viewModal.item.serialTitle}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>ISSN</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.issn || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Supplier</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.supplierName || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Frequency</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.frequency || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Quantity</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.quantity || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Delivery Date</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                    {viewModal.item.deliveryDate 
                      ? new Date(viewModal.item.deliveryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Received Date</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                    {viewModal.item.receivedDate 
                      ? new Date(viewModal.item.receivedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Category</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.category || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Status</p>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    background: viewModal.item.status === 'received' ? '#28a745' : '#17a2b8',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {viewModal.item.status === 'received' ? 'Received' : 'For Delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Attachment Section */}
            <div>
              <h4 style={{ margin: '0 0 16px', fontSize: 16, color: '#333', borderBottom: '2px solid #004A98', paddingBottom: 8 }}>
                Attachment
              </h4>
              {viewModal.item.attachmentUrl && !reuploadPreview ? (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={viewModal.item.attachmentUrl}
                    alt="Serial Attachment"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 300,
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(viewModal.item.attachmentUrl, '_blank');
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                      if (e.target.nextSibling.nextSibling) e.target.nextSibling.nextSibling.style.display = 'none';
                    }}
                  />
                  <div style={{ display: 'none', padding: 20, background: '#f8f9fa', borderRadius: 8 }}>
                    <p style={{ margin: 0, color: '#dc3545', fontSize: 14 }}>Failed to load image</p>
                  </div>
                  <p style={{ margin: '12px 0 0', fontSize: 12, color: '#666' }}>
                    Click image to view full size in new tab
                  </p>
                </div>
              ) : !reuploadPreview ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 40, 
                  background: '#f8f9fa', 
                  borderRadius: 8,
                  color: '#666',
                }}>
                  <MdImage size={48} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 14 }}>No attachment uploaded yet</p>
                </div>
              ) : null}

              {/* Re-upload Preview */}
              {reuploadPreview && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: '#28a745', marginBottom: 8, fontWeight: 500 }}>New image preview:</p>
                  <img
                    src={reuploadPreview}
                    alt="New attachment preview"
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '2px solid #28a745' }}
                  />
                  <button
                    onClick={() => { setReuploadFile(null); setReuploadPreview(null); }}
                    style={{
                      display: 'block',
                      margin: '8px auto 0',
                      padding: '4px 12px',
                      fontSize: 12,
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <MdClose style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Remove
                  </button>
                </div>
              )}

              {/* Re-upload Button */}
              {viewModal.item.status === 'received' && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <input
                    type="file"
                    ref={reuploadFileInputRef}
                    onChange={handleReuploadFileSelect}
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    style={{ display: 'none' }}
                  />
                  {!reuploadPreview ? (
                    <button
                      onClick={() => reuploadFileInputRef.current?.click()}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: '1px dashed #004A98',
                        background: 'transparent',
                        color: '#004A98',
                        cursor: 'pointer',
                        fontSize: 13,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <MdCloudUpload size={18} />
                      {viewModal.item.attachmentUrl ? 'Re-upload Image' : 'Upload Image'}
                    </button>
                  ) : (
                    <button
                      onClick={handleReuploadSubmit}
                      disabled={reuploadUploading}
                      style={{
                        padding: '8px 20px',
                        borderRadius: 6,
                        border: 'none',
                        background: reuploadUploading ? '#6c757d' : '#28a745',
                        color: '#fff',
                        cursor: reuploadUploading ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {reuploadUploading ? 'Uploading...' : 'Save New Image'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button
                onClick={handleCloseViewModal}
                style={{
                  padding: '10px 32px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#004A98',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Movement History Modal */}
      <ProcessMovementHistory
        isOpen={historyModal.open}
        onClose={() => setHistoryModal({ open: false, serial: null })}
        recordType="subscription"
        recordId={historyModal.serial?.subscription_id}
        title={historyModal.serial?.serialTitle}
      />
    </div>
  );
}

export default function DashboardGSPSDeliveryStatus() {
  return (
    <GSPSLayout title="Delivery Status">
      <DeliveryStatus />
    </GSPSLayout>
  );
}