import React, { useState, useEffect } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { Head, usePage } from '@inertiajs/react';
import { MdAdd, MdClose, MdSearch } from "react-icons/md";
import axios from 'axios';

export default function AddSerial() {
  const { approvedSuppliers = [] } = usePage().props;
  
  const [formData, setFormData] = useState({
    serialTitle: '',
    issn: '',
    supplierName: '',
    supplierId: '',
    period: '',
    awardCost: '',
    frequency: 'Monthly',
    authorPublisher: '',
    category: '',
    note: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSupplierSelect = (e) => {
    const selectedId = e.target.value;
    const supplier = approvedSuppliers.find(s => (s._id || s.id) === selectedId);
    if (supplier) {
      setFormData(prev => ({
        ...prev,
        supplierId: selectedId,
        supplierName: supplier.company_name || supplier.supplierName
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      const response = await axios.post('/api/subscriptions', {
        serial_title: formData.serialTitle,
        issn: formData.issn,
        supplier_id: formData.supplierId,
        supplier_name: formData.supplierName,
        period: formData.period,
        award_cost: parseFloat(formData.awardCost) || 0,
        frequency: formData.frequency,
        author_publisher: formData.authorPublisher,
        category: formData.category,
        note: formData.note
      });
      
      if (response.data.success) {
        setSuccessMessage('Serial subscription added successfully!');
        setFormData({
          serialTitle: '',
          issn: '',
          supplierName: '',
          supplierId: '',
          period: '',
          awardCost: '',
          frequency: 'Monthly',
          authorPublisher: '',
          category: '',
          note: ''
        });
      }
    } catch (err) {
      console.error('Error adding serial:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to add serial subscription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  };
  
  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    color: '#374151',
    fontSize: '14px'
  };

  return (
    <TPULayout title="Add Serial">
      <Head title="Add Serial" />
      
      <div style={{ padding: '24px' }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#1f2937', 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <MdAdd size={24} color="#004A98" />
            Add New Serial Subscription
          </h2>
          
          {successMessage && (
            <div style={{ 
              background: '#d1fae5', 
              color: '#065f46', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '16px' 
            }}>
              {successMessage}
            </div>
          )}
          
          {errorMessage && (
            <div style={{ 
              background: '#fee2e2', 
              color: '#b91c1c', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '16px' 
            }}>
              {errorMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Serial Title *</label>
                <input
                  type="text"
                  name="serialTitle"
                  value={formData.serialTitle}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                  placeholder="Enter serial title"
                />
              </div>
              
              <div>
                <label style={labelStyle}>ISSN *</label>
                <input
                  type="text"
                  name="issn"
                  value={formData.issn}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                  placeholder="e.g., 1234-5678"
                />
              </div>
              
              <div>
                <label style={labelStyle}>Supplier *</label>
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleSupplierSelect}
                  style={inputStyle}
                  required
                >
                  <option value="">Select a supplier</option>
                  {approvedSuppliers.map(supplier => (
                    <option key={supplier._id || supplier.id} value={supplier._id || supplier.id}>
                      {supplier.company_name || supplier.supplierName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={labelStyle}>Period *</label>
                <input
                  type="text"
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                  placeholder="e.g., 2025-2026"
                />
              </div>
              
              <div>
                <label style={labelStyle}>Award Cost (₱)</label>
                <input
                  type="number"
                  name="awardCost"
                  value={formData.awardCost}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              
              <div>
                <label style={labelStyle}>Frequency</label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Bi-Monthly">Bi-Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Semi-Annual">Semi-Annual</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
              
              <div>
                <label style={labelStyle}>Author/Publisher</label>
                <input
                  type="text"
                  name="authorPublisher"
                  value={formData.authorPublisher}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Enter author or publisher"
                />
              </div>
              
              <div>
                <label style={labelStyle}>Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g., Science, Technology"
                />
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Notes</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: submitting ? '#9ca3af' : '#004A98',
                  color: '#fff',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '500',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MdAdd size={18} />
                {submitting ? 'Adding...' : 'Add Serial'}
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({
                  serialTitle: '',
                  issn: '',
                  supplierName: '',
                  supplierId: '',
                  period: '',
                  awardCost: '',
                  frequency: 'Monthly',
                  authorPublisher: '',
                  category: '',
                  note: ''
                })}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </TPULayout>
  );
}
