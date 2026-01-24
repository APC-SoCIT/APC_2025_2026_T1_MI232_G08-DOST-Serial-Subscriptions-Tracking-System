// resources/js/Pages/Dashboard_TPU_AddSerial.jsx
import React, { useState } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { 
  MdAddCircle, MdDelete, 
  MdSearch, MdFilterList, MdDescription,
  MdCalendarToday, MdInventory,
  MdEdit, MdVisibility
} from "react-icons/md";

function AddSerial() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [formData, setFormData] = useState({
    supplierName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    subscriptionPeriod: '',
    subscriptionYear: new Date().getFullYear().toString(),
    expectedDeliveryDate: '',
    notes: '',
  });

  const [currentItem, setCurrentItem] = useState({
    serialTitle: '',
    issn: '',
    language: 'English',
    authorPublisher: '',
    abbreviation: '',
    frequency: 'Biweekly',
    category: '',
    quantity: 1,
    unitPrice: '',
    totalPrice: ''
  });

  const [items, setItems] = useState([
    {
      id: 1,
      serialTitle: 'Cell',
      issn: '0092-8674',
      language: 'English',
      authorPublisher: 'Cell Press',
      abbreviation: 'Cell Press',
      frequency: 'Biweekly',
      category: 'Science',
      quantity: 1,
      unitPrice: '5000.00',
      totalPrice: '5000.00'
    },
    {
      id: 2,
      serialTitle: 'Nature',
      issn: '0028-0836',
      language: 'English',
      authorPublisher: 'Nature Publishing Group',
      abbreviation: 'Nature',
      frequency: 'Weekly',
      category: 'Science',
      quantity: 1,
      unitPrice: '7500.00',
      totalPrice: '7500.00'
    },
    {
      id: 3,
      serialTitle: 'The Lancet',
      issn: '0140-6736',
      language: 'English',
      authorPublisher: 'Elsevier',
      abbreviation: 'Lancet',
      frequency: 'Weekly',
      category: 'Medical',
      quantity: 1,
      unitPrice: '6000.00',
      totalPrice: '6000.00'
    }
  ]);

  // Options for dropdowns
  const languageOptions = ['English', 'French', 'Spanish', 'German', 'Japanese', 'Chinese'];
  const frequencyOptions = ['Biweekly', 'Weekly', 'Monthly', 'Quarterly', 'Annually'];
  const categories = ['Science', 'Medical', 'Economics', 'Geography', 'Technology', 'Business', 'Psychology', 'Arts', 'Engineering', 'Education'];
  const years = ['2023', '2024', '2025', '2026'];

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.serialTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.issn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.authorPublisher.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'All' || item.category === filter;
    
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const calculateStats = () => {
    const totalItems = items.length;
    const totalCost = items.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);
    
    return { totalItems, totalCost };
  };

  const stats = calculateStats();

  // Check if supplier and subscription details are complete
  const isSupplierInfoComplete = () => {
    return formData.supplierName.trim() !== '' && 
           formData.contactPerson.trim() !== '' && 
           formData.email.trim() !== '';
  };

  const isSubscriptionComplete = () => {
    return formData.subscriptionPeriod.trim() !== '';
  };

  const canAddSerialItems = () => {
    return isSupplierInfoComplete() && isSubscriptionComplete();
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle item input changes
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    const updatedItem = {
      ...currentItem,
      [name]: value
    };

    // Calculate total price if quantity or unit price changes
    if (name === 'quantity' || name === 'unitPrice') {
      const quantity = name === 'quantity' ? parseInt(value) || 0 : parseInt(currentItem.quantity) || 0;
      const unitPrice = name === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(currentItem.unitPrice) || 0;
      updatedItem.totalPrice = (quantity * unitPrice).toFixed(2);
    }

    setCurrentItem(updatedItem);
  };

  // Add new item
  const handleAddItem = () => {
    // Check if supplier and subscription details are complete
    if (!canAddSerialItems()) {
      alert('Please complete Supplier Information and Subscription Details first before adding serial items.');
      return;
    }

    if (!currentItem.serialTitle || !currentItem.issn) {
      alert('Please fill in Serial Title and ISSN');
      return;
    }

    const newItem = {
      id: Date.now(),
      ...currentItem,
      totalPrice: currentItem.totalPrice || (currentItem.quantity * (parseFloat(currentItem.unitPrice) || 0)).toFixed(2)
    };
    setItems([...items, newItem]);

    // Reset form
    setCurrentItem({
      serialTitle: '',
      issn: '',
      language: 'English',
      authorPublisher: '',
      abbreviation: '',
      frequency: 'Biweekly',
      category: '',
      quantity: 1,
      unitPrice: '',
      totalPrice: ''
    });
  };

  // Open edit modal
  const handleEditItem = (item) => {
    setEditingId(item.id);
    setCurrentItem({
      serialTitle: item.serialTitle,
      issn: item.issn,
      language: item.language,
      authorPublisher: item.authorPublisher,
      abbreviation: item.abbreviation,
      frequency: item.frequency,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    });
    setShowEditModal(true);
  };

  // Open view modal
  const handleViewItem = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  // Update item
  const handleUpdateItem = () => {
    if (!currentItem.serialTitle || !currentItem.issn) {
      alert('Please fill in Serial Title and ISSN');
      return;
    }

    setItems(items.map(item => 
      item.id === editingId ? { ...currentItem, id: editingId } : item
    ));
    setEditingId(null);
    setShowEditModal(false);
    setCurrentItem({
      serialTitle: '',
      issn: '',
      language: 'English',
      authorPublisher: '',
      abbreviation: '',
      frequency: 'Biweekly',
      category: '',
      quantity: 1,
      unitPrice: '',
      totalPrice: ''
    });
  };

  // Delete item
  const handleDeleteItem = (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingId(null);
    setCurrentItem({
      serialTitle: '',
      issn: '',
      language: 'English',
      authorPublisher: '',
      abbreviation: '',
      frequency: 'Biweekly',
      category: '',
      quantity: 1,
      unitPrice: '',
      totalPrice: ''
    });
  };

  // Close view modal
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedItem(null);
  };

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 120px)' }}>
      {/* Header Section */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px', 
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        borderLeft: '4px solid #004A98'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              color: '#004A98', 
              fontSize: '24px', 
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              Add Serial Subscription
            </h2>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Manage serial subscriptions with detailed supplier information and item tracking
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                if (!canAddSerialItems()) {
                  alert('Please complete Supplier Information and Subscription Details first before previewing.');
                  return;
                }
                setShowPreview(!showPreview);
              }}
              style={{
                padding: '10px 20px',
                background: '#f0f4f8',
                border: '1px solid #ddd',
                borderRadius: '6px',
                color: '#666',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '500'
              }}
            >
              <MdDescription /> {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '16px', 
          marginTop: '20px' 
        }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: '8px', 
            padding: '16px',
            borderTop: '4px solid #004A98',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '14px', color: '#666', margin: '0 0 8px 0' }}>Total Items</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#004A98' }}>
              {stats.totalItems}
            </p>
          </div>
          <div style={{ 
            background: '#fff', 
            borderRadius: '8px', 
            padding: '16px',
            borderTop: '4px solid #004A98',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '14px', color: '#666', margin: '0 0 8px 0' }}>Total Cost</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#004A98' }}>
              ₱{stats.totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#004A98', 
                fontSize: '20px', 
                fontWeight: '600'
              }}>
                Edit Serial Item
              </h2>
              <button
                onClick={handleCloseEditModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Serial Title <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="serialTitle"
                  value={currentItem.serialTitle}
                  onChange={handleItemChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  ISSN <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="issn"
                  value={currentItem.issn}
                  onChange={handleItemChange}
                  required
                  placeholder="e.g., 1234-5678"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Category
                </label>
                <select
                  name="category"
                  value={currentItem.category}
                  onChange={handleItemChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Language
                </label>
                <select
                  name="language"
                  value={currentItem.language}
                  onChange={handleItemChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {languageOptions.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Author/Publisher <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="authorPublisher"
                  value={currentItem.authorPublisher}
                  onChange={handleItemChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Frequency
                </label>
                <select
                  name="frequency"
                  value={currentItem.frequency}
                  onChange={handleItemChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {frequencyOptions.map(freq => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Abbreviation
                </label>
                <input
                  type="text"
                  name="abbreviation"
                  value={currentItem.abbreviation}
                  onChange={handleItemChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={currentItem.quantity}
                  onChange={handleItemChange}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Unit Price (₱)
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={currentItem.unitPrice}
                  onChange={handleItemChange}
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Total Price (₱)
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#004A98'
                }}>
                  ₱{currentItem.totalPrice ? parseFloat(currentItem.totalPrice).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={handleCloseEditModal}
                style={{
                  padding: '12px 24px',
                  background: '#f0f4f8',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  color: '#666',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateItem}
                style={{
                  padding: '12px 32px',
                  background: '#004A98',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'background 0.2s'
                }}
              >
                Update Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#004A98', 
                fontSize: '20px', 
                fontWeight: '600'
              }}>
                Serial Information Details
              </h2>
              <button
                onClick={handleCloseViewModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Supplier Information Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                color: '#004A98', 
                margin: '0 0 16px 0',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <MdInventory /> Supplier Information
              </h3>
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Supplier Name:</strong> {formData.supplierName || 'Not provided'}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Contact Person:</strong> {formData.contactPerson || 'Not provided'}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Email:</strong> {formData.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Phone:</strong> {formData.phone || 'Not provided'}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Address:</strong> {formData.address || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Details Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                color: '#004A98', 
                margin: '0 0 16px 0',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <MdCalendarToday /> Subscription Details
              </h3>
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Subscription Period:</strong> {formData.subscriptionPeriod || 'Not provided'}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Subscription Year:</strong> {formData.subscriptionYear}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Expected Delivery Date:</strong> {formData.expectedDeliveryDate || 'Not provided'}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Total Cost:</strong> ₱{stats.totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                {formData.notes && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Notes:</strong> {formData.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Serial Item Details Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                color: '#004A98', 
                margin: '0 0 16px 0',
                fontWeight: '600'
              }}>
                Serial Item Details
              </h3>
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Serial Title:</strong> {selectedItem.serialTitle}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>ISSN:</strong> {selectedItem.issn}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Category:</strong> {selectedItem.category}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Language:</strong> {selectedItem.language}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Author/Publisher:</strong> {selectedItem.authorPublisher}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Abbreviation:</strong> {selectedItem.abbreviation || 'Not provided'}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Frequency:</strong> {selectedItem.frequency}
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '16px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #dee2e6'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>Quantity</p>
                    <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: 'bold' }}>{selectedItem.quantity}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>Unit Price</p>
                    <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: 'bold', color: '#004A98' }}>
                      ₱{parseFloat(selectedItem.unitPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>Total Price</p>
                    <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                      ₱{parseFloat(selectedItem.totalPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={handleCloseViewModal}
                style={{
                  padding: '12px 32px',
                  background: '#004A98',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'background 0.2s'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#004A98', 
                fontSize: '20px', 
                fontWeight: '600'
              }}>
                Subscription Preview
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                color: '#004A98', 
                margin: '0 0 16px 0',
                fontWeight: '600'
              }}>
                Supplier Information
              </h3>
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Supplier Name:</strong> {formData.supplierName || 'Not provided'}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Contact Person:</strong> {formData.contactPerson || 'Not provided'}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Email:</strong> {formData.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Phone:</strong> {formData.phone || 'Not provided'}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Subscription Period:</strong> {formData.subscriptionPeriod || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              <h3 style={{ 
                fontSize: '16px', 
                color: '#004A98', 
                margin: '0 0 16px 0',
                fontWeight: '600'
              }}>
                Serial Items ({items.length})
              </h3>
              {items.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#e9ecef' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Serial Title</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ISSN</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Category</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Unit Price</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{item.serialTitle}</td>
                          <td style={{ padding: '12px' }}>{item.issn}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              background: '#e3f2fd',
                              color: '#004A98',
                              fontSize: '12px'
                            }}>
                              {item.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            ₱{parseFloat(item.unitPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#004A98' }}>
                            ₱{parseFloat(item.totalPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  background: '#f8f9fa',
                  padding: '40px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  No items added yet
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  padding: '10px 20px',
                  background: '#f0f4f8',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  color: '#666',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Left Column - Supplier Information */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: !isSupplierInfoComplete() ? '1px solid #dc3545' : 'none'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px' 
            }}>
              <MdInventory style={{ color: !isSupplierInfoComplete() ? '#dc3545' : '#004A98', fontSize: '24px' }} />
              <h3 style={{ margin: 0, color: !isSupplierInfoComplete() ? '#dc3545' : '#004A98', fontSize: '18px', fontWeight: '600' }}>
                Supplier Information {!isSupplierInfoComplete() && <span style={{ fontSize: '14px', color: '#dc3545' }}>(Required)</span>}
              </h3>
            </div>

            {!isSupplierInfoComplete() && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                color: '#856404',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                Please complete Supplier Information (Supplier Name, Contact Person, and Email) before adding serial items.
              </div>
            )}

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: !isSupplierInfoComplete() && !formData.supplierName ? '#dc3545' : '#333',
                  fontWeight: '500'
                }}>
                  Supplier Name <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: !isSupplierInfoComplete() && !formData.supplierName ? '1px solid #dc3545' : '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: !isSupplierInfoComplete() && !formData.contactPerson ? '#dc3545' : '#333',
                  fontWeight: '500'
                }}>
                  Contact Person <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: !isSupplierInfoComplete() && !formData.contactPerson ? '1px solid #dc3545' : '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: !isSupplierInfoComplete() && !formData.email ? '#dc3545' : '#333',
                  fontWeight: '500'
                }}>
                  Email Address <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: !isSupplierInfoComplete() && !formData.email ? '1px solid #dc3545' : '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    color: '#333',
                    fontWeight: '500'
                  }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    color: '#333',
                    fontWeight: '500'
                  }}>
                    Subscription Year
                  </label>
                  <select
                    name="subscriptionYear"
                    value={formData.subscriptionYear}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Subscription Details */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: !isSubscriptionComplete() ? '1px solid #dc3545' : 'none'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px' 
            }}>
              <MdCalendarToday style={{ color: !isSubscriptionComplete() ? '#dc3545' : '#004A98', fontSize: '24px' }} />
              <h3 style={{ margin: 0, color: !isSubscriptionComplete() ? '#dc3545' : '#004A98', fontSize: '18px', fontWeight: '600' }}>
                Subscription Details {!isSubscriptionComplete() && <span style={{ fontSize: '14px', color: '#dc3545' }}>(Required)</span>}
              </h3>
            </div>

            {!isSubscriptionComplete() && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                color: '#856404',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                Please complete Subscription Details (Subscription Period) before adding serial items.
              </div>
            )}

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: !isSubscriptionComplete() ? '#dc3545' : '#333',
                  fontWeight: '500'
                }}>
                  Subscription Period <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="subscriptionPeriod"
                  value={formData.subscriptionPeriod}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Jan-Dec 2025"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: !isSubscriptionComplete() ? '1px solid #dc3545' : '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  name="expectedDeliveryDate"
                  value={formData.expectedDeliveryDate}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Total Subscription Cost
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#004A98',
                  textAlign: 'center'
                }}>
                  ₱{stats.totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Additional notes or special instructions..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '100px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Serial Items Management */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px' 
          }}>
            <div>
              <h2 style={{ color: '#004A98', margin: 0, fontSize: '20px' }}>Serial Items</h2>
              <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '14px' }}>
                Add and manage serial publications for this subscription
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <MdSearch style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#666' 
                }} />
                <input
                  type="text"
                  placeholder="Search serials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '200px',
                    padding: '10px 10px 10px 40px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Filter */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: '#f8f9fa',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
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
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    padding: '16px',
                    width: '180px',
                    zIndex: 10,
                    marginTop: '8px',
                  }}>
                    <p style={{ margin: '0 0 12px 0', fontWeight: 500, fontSize: '14px' }}>Filter by Category</p>
                    {['All', ...categories].map(option => (
                      <label key={option} style={{ display: 'block', marginBottom: 10, cursor: 'pointer', fontSize: '14px' }}>
                        <input
                          type="radio"
                          checked={filter === option}
                          onChange={() => {
                            setFilter(option);
                            setShowFilter(false);
                          }}
                          style={{ marginRight: '8px' }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add New Item Form */}
          <div style={{ 
            background: '#f8f9fa', 
            borderRadius: '8px', 
            padding: '20px', 
            marginBottom: '24px',
            border: '1px solid #dee2e6',
            opacity: canAddSerialItems() ? 1 : 0.7
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, color: '#004A98', fontSize: '16px' }}>
                Add New Serial Item
              </h4>
              {!canAddSerialItems() && (
                <div style={{
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  color: '#856404',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  Complete Supplier and Subscription details first
                </div>
              )}
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>
                  Serial Title <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="serialTitle"
                  value={currentItem.serialTitle}
                  onChange={handleItemChange}
                  placeholder="Enter Serial Title"
                  required
                  disabled={!canAddSerialItems()}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: canAddSerialItems() ? '#fff' : '#f8f9fa'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>
                  ISSN <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="issn"
                  value={currentItem.issn}
                  onChange={handleItemChange}
                  placeholder="e.g., 1234-5678"
                  required
                  disabled={!canAddSerialItems()}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: canAddSerialItems() ? '#fff' : '#f8f9fa'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>
                  Category
                </label>
                <select
                  name="category"
                  value={currentItem.category}
                  onChange={handleItemChange}
                  disabled={!canAddSerialItems()}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: canAddSerialItems() ? '#fff' : '#f8f9fa',
                    cursor: canAddSerialItems() ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>
                  Language
                </label>
                <select
                  name="language"
                  value={currentItem.language}
                  onChange={handleItemChange}
                  disabled={!canAddSerialItems()}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: canAddSerialItems() ? '#fff' : '#f8f9fa',
                    cursor: canAddSerialItems() ? 'pointer' : 'not-allowed'
                  }}
                >
                  {languageOptions.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>
                  Author/Publisher <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="authorPublisher"
                  value={currentItem.authorPublisher}
                  onChange={handleItemChange}
                  placeholder="Enter Author/Publisher"
                  required
                  disabled={!canAddSerialItems()}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: canAddSerialItems() ? '#fff' : '#f8f9fa'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>
                  Abbreviation
                </label>
                <input
                  type="text"
                  name="abbreviation"
                  value={currentItem.abbreviation}
                  onChange={handleItemChange}
                  placeholder="Enter Abbreviation"
                  disabled={!canAddSerialItems()}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: canAddSerialItems() ? '#fff' : '#f8f9fa'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>
                  Frequency
                </label>
                <select
                  name="frequency"
                  value={currentItem.frequency}
                  onChange={handleItemChange}
                  disabled={!canAddSerialItems()}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: canAddSerialItems() ? '#fff' : '#f8f9fa',
                    cursor: canAddSerialItems() ? 'pointer' : 'not-allowed'
                  }}
                >
                  {frequencyOptions.map(freq => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={currentItem.quantity}
                    onChange={handleItemChange}
                    min="1"
                    disabled={!canAddSerialItems()}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: canAddSerialItems() ? '#fff' : '#f8f9fa'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>
                    Unit Price (₱)
                  </label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={currentItem.unitPrice}
                    onChange={handleItemChange}
                    min="0"
                    step="0.01"
                    disabled={!canAddSerialItems()}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: canAddSerialItems() ? '#fff' : '#f8f9fa'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>
                    Total Price (₱)
                  </label>
                  <div style={{
                    padding: '10px 12px',
                    background: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#004A98'
                  }}>
                    {currentItem.totalPrice ? `₱${parseFloat(currentItem.totalPrice).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₱0.00'}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!canAddSerialItems()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: canAddSerialItems() ? '#28a745' : '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: canAddSerialItems() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  opacity: canAddSerialItems() ? 1 : 0.7
                }}
              >
                <MdAddCircle /> Add
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  background: 'linear-gradient(90deg, #004A98, #0066CC)',
                  color: '#fff'
                }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Serial Title</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>ISSN</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Category</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Author/Publisher</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Frequency</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Quantity</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Unit Price</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Total</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr 
                    key={item.id} 
                    style={{ 
                      borderBottom: '1px solid #eee',
                      background: index % 2 === 0 ? '#fff' : '#f9f9f9'
                    }}
                  >
                    <td style={{ padding: '16px', fontWeight: 500 }}>{item.serialTitle}</td>
                    <td style={{ padding: '16px' }}>{item.issn}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: '#e3f2fd',
                        color: '#004A98',
                        fontSize: '12px'
                      }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>{item.authorPublisher}</td>
                    <td style={{ padding: '16px' }}>{item.frequency}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '16px' }}>
                      ₱{parseFloat(item.unitPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 'bold', color: '#004A98' }}>
                      ₱{parseFloat(item.totalPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleViewItem(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            background: '#17a2b8',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          <MdVisibility /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditItem(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            background: '#ffc107',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          <MdEdit /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.serialTitle)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            background: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          <MdDelete /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div style={{ 
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            <div>
              Showing {filteredItems.length} of {items.length} items
              {filter !== 'All' && ` (${filter} only)`}
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#004A98' }}>
                Grand Total: ₱{stats.totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardTPUAddSerial() {
  return (
    <TPULayout title="Add Serial Subscription">
      <AddSerial />
    </TPULayout>
  );
}