import React, { useState } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { MdSearch, MdFilterList, MdOutlineInfo, MdAddCircle, MdClose, MdDelete, MdEdit } from "react-icons/md";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

// Subscription Tracking Component
function SubscriptionTracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [sortBy, setSortBy] = useState('serialTitle');
  
  // Add Serial Modal state
  const [showAddSerialModal, setShowAddSerialModal] = useState(false);
  const [serialFormData, setSerialFormData] = useState({
    serialTitle: '',
    issn: '',
    language: 'English',
    authorPublisher: '',
    supplierName: '',
    abbreviation: '',
    frequency: 'Biweekly',
    category: '',
    period: 'Jan-Dec 2026',
    quantity: 1,
    unitPrice: '',
    totalPrice: ''
  });
  const [serialItems, setSerialItems] = useState([]);

  // Dropdown options for serial form
  const languageOptions = ['English', 'French', 'Spanish', 'German', 'Japanese', 'Chinese'];
  const frequencyOptions = ['Biweekly', 'Weekly', 'Monthly', 'Quarterly', 'Annually'];
  const categories = ['Science', 'Medical', 'Economics', 'Geography', 'Technology', 'Business', 'Psychology', 'Arts', 'Engineering', 'Education'];
  const supplierOptions = ['ABC Books Supplier', 'MedJournal Suppliers Inc.', 'Global Periodicals Co.', 'EastAsia Books & Journals', 'Other'];

  // View Details Modal state
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState(null);

  // Subscription data as state so it can be updated
  const [subscriptionData, setSubscriptionData] = useState([
    {
      id: 1,
      serialTitle: 'Nature',
      issn: '0028-0836',
      supplierName: 'ABC Books Supplier',
      period: 'Jan-Dec 2025',
      awardCost: 'P60,000',
      status: 'Active',
      language: 'English',
      frequency: 'Weekly',
      category: 'Science',
      authorPublisher: 'Nature Publishing Group',
      dateAdded: '2025-01-15',
      transactions: [
        { date: '2025-01-15', type: 'Subscription Created', amount: 'P60,000', description: 'Initial subscription' },
        { date: '2025-02-10', type: 'Delivery', amount: '-', description: 'Issue Vol. 589 received' },
        { date: '2025-03-10', type: 'Delivery', amount: '-', description: 'Issue Vol. 590 received' }
      ]
    },
    {
      id: 2,
      serialTitle: 'The Lancet',
      issn: '0140-6736',
      supplierName: 'MedJournal Suppliers Inc.',
      period: 'Jan-Dec 2025',
      awardCost: 'P120,000',
      status: 'Active',
      language: 'English',
      frequency: 'Weekly',
      category: 'Medical',
      authorPublisher: 'Elsevier',
      dateAdded: '2025-01-10',
      transactions: [
        { date: '2025-01-10', type: 'Subscription Created', amount: 'P120,000', description: 'Initial subscription' },
        { date: '2025-01-20', type: 'Delivery', amount: '-', description: 'Issue Vol. 405 received' }
      ]
    },
    {
      id: 3,
      serialTitle: 'Science',
      issn: '0036-8075',
      supplierName: 'Global Periodicals Co.',
      period: 'Jan-Dec 2025',
      awardCost: 'P40,000',
      status: 'Active',
      language: 'English',
      frequency: 'Weekly',
      category: 'Science',
      authorPublisher: 'AAAS',
      dateAdded: '2025-01-12',
      transactions: [
        { date: '2025-01-12', type: 'Subscription Created', amount: 'P40,000', description: 'Initial subscription' }
      ]
    },
    {
      id: 4,
      serialTitle: 'Asian Economic Review',
      issn: '1234-5678',
      supplierName: 'EastAsia Books & Journals',
      period: 'Jan-Dec 2025',
      awardCost: 'P58,000',
      status: 'Active',
      language: 'English',
      frequency: 'Quarterly',
      category: 'Economics',
      authorPublisher: 'Asian Economic Publishers',
      dateAdded: '2025-01-08',
      transactions: [
        { date: '2025-01-08', type: 'Subscription Created', amount: 'P58,000', description: 'Initial subscription' }
      ]
    },
    {
      id: 5,
      serialTitle: 'Medical Digest',
      issn: '9876-5432',
      supplierName: 'MedJournal Suppliers Inc.',
      period: 'Jan-Dec 2025',
      awardCost: 'P20,000',
      status: 'Pending',
      language: 'English',
      frequency: 'Monthly',
      category: 'Medical',
      authorPublisher: 'Medical Digest Inc.',
      dateAdded: '2025-01-20',
      transactions: [
        { date: '2025-01-20', type: 'Subscription Created', amount: 'P20,000', description: 'Initial subscription - awaiting first delivery' }
      ]
    },
  ]);

  // Filter subscriptions
  const filteredSubscriptions = subscriptionData.filter(subscription => {
    const matchesSearch = 
      subscription.serialTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPeriod = periodFilter === 'All' || subscription.period.includes(periodFilter);
    
    return matchesSearch && matchesPeriod;
  });

  // Sort subscriptions
  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    if (sortBy === 'serialTitle') return a.serialTitle.localeCompare(b.serialTitle);
    if (sortBy === 'supplierName') return a.supplierName.localeCompare(b.supplierName);
    if (sortBy === 'awardCost') {
      const aCost = parseFloat(a.awardCost.replace(/[^0-9.]/g, '') || 0);
      const bCost = parseFloat(b.awardCost.replace(/[^0-9.]/g, '') || 0);
      return bCost - aCost;
    }
    return 0;
  });

  // Calculate total stats
  const totalAwardCost = subscriptionData.reduce((sum, item) => {
    const cost = parseFloat(item.awardCost.replace(/[^0-9.]/g, '') || 0);
    return sum + cost;
  }, 0);

  const totalSubscriptions = subscriptionData.length;
  const activeSubscriptions = subscriptionData.filter(s => s.status === 'Active').length;
  const pendingSubscriptions = subscriptionData.filter(s => s.status === 'Pending').length;

  const stats = [
    { 
      title: 'Total Subscriptions', 
      value: totalSubscriptions, 
      icon: <FiTrendingUp />,
      color: '#004A98',
      trend: 'up'
    },
    { 
      title: 'Active Subscriptions', 
      value: activeSubscriptions, 
      icon: <FiTrendingUp />,
      color: '#28a745',
      trend: 'up'
    },
    { 
      title: 'Pending Subscriptions', 
      value: pendingSubscriptions, 
      icon: pendingSubscriptions > 0 ? <FiTrendingDown /> : <FiTrendingUp />,
      color: pendingSubscriptions > 0 ? '#ffc107' : '#28a745',
      trend: pendingSubscriptions > 0 ? 'down' : 'up'
    },
    { 
      title: 'Total Award Cost', 
      value: `P${totalAwardCost.toLocaleString()}`, 
      icon: <FiTrendingUp />,
      color: '#004A98',
      trend: 'up'
    },
  ];

  const handleViewDetails = (subscription) => {
    setSelectedSerial(subscription);
    setShowViewDetailsModal(true);
  };

  const handleCloseViewDetailsModal = () => {
    setShowViewDetailsModal(false);
    setSelectedSerial(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return { bg: '#d4edda', text: '#155724' };
      case 'Pending': return { bg: '#fff3cd', text: '#856404' };
      case 'Inactive': return { bg: '#f8d7da', text: '#721c24' };
      default: return { bg: '#e2e3e5', text: '#383d41' };
    }
  };

  // Add Serial handlers
  const handleOpenAddSerialModal = () => {
    setSerialItems([]);
    setShowAddSerialModal(true);
  };

  const handleCloseAddSerialModal = () => {
    setShowAddSerialModal(false);
    setSerialFormData({
      serialTitle: '',
      issn: '',
      language: 'English',
      authorPublisher: '',
      supplierName: '',
      abbreviation: '',
      frequency: 'Biweekly',
      category: '',
      period: 'Jan-Dec 2026',
      quantity: 1,
      unitPrice: '',
      totalPrice: ''
    });
    setSerialItems([]);
  };

  const handleSerialInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...serialFormData, [name]: value };
    
    if (name === 'quantity' || name === 'unitPrice') {
      const quantity = name === 'quantity' ? parseInt(value) || 0 : parseInt(serialFormData.quantity) || 0;
      const unitPrice = name === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(serialFormData.unitPrice) || 0;
      updatedData.totalPrice = (quantity * unitPrice).toFixed(2);
    }
    
    setSerialFormData(updatedData);
  };

  const handleAddSerialItem = () => {
    if (!serialFormData.serialTitle || !serialFormData.issn) {
      alert('Please fill in Serial Title and ISSN');
      return;
    }
    if (!serialFormData.supplierName) {
      alert('Please select a Supplier');
      return;
    }

    const newItem = {
      id: Date.now(),
      ...serialFormData,
      totalPrice: serialFormData.totalPrice || (serialFormData.quantity * (parseFloat(serialFormData.unitPrice) || 0)).toFixed(2)
    };
    setSerialItems([...serialItems, newItem]);

    setSerialFormData({
      serialTitle: '',
      issn: '',
      language: 'English',
      authorPublisher: '',
      supplierName: '',
      abbreviation: '',
      frequency: 'Biweekly',
      category: '',
      period: 'Jan-Dec 2026',
      quantity: 1,
      unitPrice: '',
      totalPrice: ''
    });
  };

  const handleDeleteSerialItem = (id) => {
    setSerialItems(serialItems.filter(item => item.id !== id));
  };

  const handleSaveSerials = () => {
    if (serialItems.length === 0) {
      alert('Please add at least one serial item');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Add new serials to subscriptionData
    const newSubscriptions = serialItems.map((item, index) => ({
      id: Date.now() + index,
      serialTitle: item.serialTitle,
      issn: item.issn,
      supplierName: item.supplierName || 'Unknown Supplier',
      period: item.period || 'Jan-Dec 2026',
      awardCost: `P${parseFloat(item.totalPrice || 0).toLocaleString()}`,
      status: 'Pending',
      language: item.language || 'English',
      frequency: item.frequency || 'Monthly',
      category: item.category || 'General',
      authorPublisher: item.authorPublisher || 'Unknown',
      dateAdded: today,
      transactions: [
        { date: today, type: 'Subscription Created', amount: `P${parseFloat(item.totalPrice || 0).toLocaleString()}`, description: 'Initial subscription created' }
      ]
    }));
    
    setSubscriptionData([...subscriptionData, ...newSubscriptions]);
    alert(`Successfully added ${serialItems.length} serial(s) to subscriptions`);
    handleCloseAddSerialModal();
  };

  // Progress bar component
  const ProgressBar = ({ progress }) => (
    <div style={{ 
      width: '100%', 
      height: 8, 
      background: '#e9ecef', 
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 4
    }}>
      <div style={{
        width: `${progress}%`,
        height: '100%',
        background: progress >= 100 ? '#28a745' : progress >= 70 ? '#ffc107' : '#dc3545',
        borderRadius: 4,
        transition: 'width 0.3s ease'
      }} />
    </div>
  );

  return (
    <div style={{ background: '#fff', padding: 24, height: 'calc(100vh - 73px)', overflowY: 'auto' }}>
      {/* Main Content Card */}
      <div style={{ background: '#fff', padding: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#004A98', margin: 0, fontSize: 20 }}>Subscription Details</h2>
          <button
            onClick={handleOpenAddSerialModal}
            style={{
              background: '#28a745',
              border: 'none',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#218838';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#28a745';
            }}
          >
            <MdAddCircle size={18} /> Add Serial
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search subscriptions..."
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

          <div style={{ display: 'flex', gap: 12 }}>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14,
                background: '#fff',
                minWidth: 150,
              }}
            >
              <option value="All">All Periods</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14,
                background: '#fff',
                minWidth: 150,
              }}
            >
              <option value="serialTitle">Sort by Title</option>
              <option value="supplierName">Sort by Supplier</option>
              <option value="awardCost">Sort by Award Cost</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setPeriodFilter('All');
                setSortBy('serialTitle');
              }}
              style={{
                padding: '12px 20px',
                background: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <MdFilterList /> Clear Filters
            </button>
          </div>
        </div>

        {/* Subscription Details Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Serial Title</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Supplier Name</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Period</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Award Cost</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSubscriptions.map((subscription) => (
                <tr key={subscription.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>{subscription.serialTitle}</td>
                  <td style={{ padding: '16px' }}>{subscription.supplierName}</td>
                  <td style={{ padding: '16px', color: '#666' }}>{subscription.period}</td>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: '#004A98' }}>{subscription.awardCost}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: 20,
                      background: getStatusColor(subscription.status).bg,
                      color: getStatusColor(subscription.status).text,
                      fontSize: 12,
                      fontWeight: 500,
                      display: 'inline-block',
                    }}>
                      {subscription.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      onClick={() => handleViewDetails(subscription)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #004A98',
                        color: '#004A98',
                        padding: '8px 16px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#004A98';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#004A98';
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: 30, 
          paddingTop: 20, 
          borderTop: '1px solid #eee',
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center' 
        }}>
          <div style={{ color: '#666', fontSize: 14 }}>
            Showing {sortedSubscriptions.length} of {subscriptionData.length} results
          </div>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ 
              padding: '8px 16px', 
              border: '1px solid #ddd', 
              background: '#fff', 
              borderRadius: 6, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              Previous
            </button>
            <button style={{ 
              padding: '8px 16px', 
              border: '1px solid #004A98', 
              background: '#004A98', 
              color: '#fff', 
              borderRadius: 6, 
              cursor: 'pointer' 
            }}>
              1
            </button>
            <button style={{ 
              padding: '8px 16px', 
              border: '1px solid #ddd', 
              background: '#fff', 
              borderRadius: 6, 
              cursor: 'pointer' 
            }}>
              2
            </button>
            <button style={{ 
              padding: '8px 16px', 
              border: '1px solid #ddd', 
              background: '#fff', 
              borderRadius: 6, 
              cursor: 'pointer' 
            }}>
              3
            </button>
            <button style={{ 
              padding: '8px 16px', 
              border: '1px solid #ddd', 
              background: '#fff', 
              borderRadius: 6, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Serial Modal */}
      {showAddSerialModal && (
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
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px',
              borderBottom: '1px solid #eee',
              paddingBottom: '16px'
            }}>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  color: '#004A98', 
                  fontSize: '20px', 
                  fontWeight: '600'
                }}>
                  Add Serial
                </h2>
                <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                  Fill in the serial details below to add to the subscription list
                </p>
              </div>
              <button
                onClick={handleCloseAddSerialModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <MdClose />
              </button>
            </div>

            {/* Add Serial Form */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>Serial Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Serial Title *</label>
                  <input
                    type="text"
                    name="serialTitle"
                    value={serialFormData.serialTitle}
                    onChange={handleSerialInputChange}
                    placeholder="Enter serial title"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>ISSN *</label>
                  <input
                    type="text"
                    name="issn"
                    value={serialFormData.issn}
                    onChange={handleSerialInputChange}
                    placeholder="e.g., 0028-0836"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Language</label>
                  <select
                    name="language"
                    value={serialFormData.language}
                    onChange={handleSerialInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  >
                    {languageOptions.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Author/Publisher</label>
                  <input
                    type="text"
                    name="authorPublisher"
                    value={serialFormData.authorPublisher}
                    onChange={handleSerialInputChange}
                    placeholder="Enter author/publisher"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Supplier Name *</label>
                  <select
                    name="supplierName"
                    value={serialFormData.supplierName}
                    onChange={handleSerialInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  >
                    <option value="">Select Supplier</option>
                    {supplierOptions.map(supplier => (
                      <option key={supplier} value={supplier}>{supplier}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Period *</label>
                  <select
                    name="period"
                    value={serialFormData.period}
                    onChange={handleSerialInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  >
                    <option value="Jan-Dec 2026">Jan-Dec 2026</option>
                    <option value="Jan-Dec 2025">Jan-Dec 2025</option>
                    <option value="Jan-Dec 2024">Jan-Dec 2024</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Frequency</label>
                  <select
                    name="frequency"
                    value={serialFormData.frequency}
                    onChange={handleSerialInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  >
                    {frequencyOptions.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Category</label>
                  <select
                    name="category"
                    value={serialFormData.category}
                    onChange={handleSerialInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={serialFormData.quantity}
                    onChange={handleSerialInputChange}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Unit Price (₱)</label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={serialFormData.unitPrice}
                    onChange={handleSerialInputChange}
                    placeholder="0.00"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleAddSerialItem}
                  style={{
                    padding: '10px 20px',
                    background: '#004A98',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MdAddCircle /> Add to List
                </button>
              </div>
            </div>

            {/* Added Serials List */}
            {serialItems.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>
                  Added Serials ({serialItems.length})
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Serial Title</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>ISSN</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Supplier</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Period</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Qty</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Total Cost</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serialItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px', fontSize: '13px', fontWeight: 500 }}>{item.serialTitle}</td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>{item.issn}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{item.supplierName}</td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>{item.period}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{item.quantity}</td>
                          <td style={{ padding: '12px', fontSize: '13px', fontWeight: 'bold', color: '#004A98' }}>₱{parseFloat(item.totalPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteSerialItem(item.id)}
                              style={{
                                background: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <MdDelete /> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '12px', textAlign: 'right', fontSize: '14px' }}>
                  <strong>Grand Total: </strong>
                  <span style={{ color: '#004A98', fontWeight: 'bold' }}>
                    ₱{serialItems.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={handleCloseAddSerialModal}
                style={{
                  padding: '10px 24px',
                  background: '#f8f9fa',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#666'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSerials}
                disabled={serialItems.length === 0}
                style={{
                  padding: '10px 24px',
                  background: serialItems.length > 0 ? '#28a745' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: serialItems.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Save Serials ({serialItems.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewDetailsModal && selectedSerial && (
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
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px',
              borderBottom: '1px solid #eee',
              paddingBottom: '16px'
            }}>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  color: '#004A98', 
                  fontSize: '22px', 
                  fontWeight: '600'
                }}>
                  {selectedSerial.serialTitle}
                </h2>
                <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                  Serial Subscription Details
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  background: getStatusColor(selectedSerial.status).bg,
                  color: getStatusColor(selectedSerial.status).text,
                  fontSize: 13,
                  fontWeight: 500,
                }}>
                  {selectedSerial.status}
                </span>
                <button
                  onClick={handleCloseViewDetailsModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    color: '#666',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <MdClose />
                </button>
              </div>
            </div>

            {/* Serial Information */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#004A98' }}>Serial Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>ISSN</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{selectedSerial.issn || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Supplier</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{selectedSerial.supplierName}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Publisher</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{selectedSerial.authorPublisher || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Language</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{selectedSerial.language || 'English'}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Frequency</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{selectedSerial.frequency || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Category</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{selectedSerial.category || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Period</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{selectedSerial.period}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Award Cost</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#004A98' }}>{selectedSerial.awardCost}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Date Added</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{selectedSerial.dateAdded || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div style={{
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #eee',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#004A98' }}>Transaction History</h3>
              {selectedSerial.transactions && selectedSerial.transactions.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Type</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Amount</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSerial.transactions.map((transaction, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>{transaction.date}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: 12,
                              background: transaction.type === 'Subscription Created' ? '#e3f2fd' : 
                                         transaction.type === 'Delivery' ? '#e8f5e9' : '#fff3e0',
                              color: transaction.type === 'Subscription Created' ? '#1565c0' : 
                                    transaction.type === 'Delivery' ? '#2e7d32' : '#ef6c00',
                              fontSize: 12,
                              fontWeight: 500,
                            }}>
                              {transaction.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px', fontWeight: 500 }}>{transaction.amount}</td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>{transaction.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                  No transactions recorded yet.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '20px',
              marginTop: '20px',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={handleCloseViewDetailsModal}
                style={{
                  padding: '10px 24px',
                  background: '#004A98',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardTPUSubscriptionTracking() {
  return (
    <TPULayout title="Subscription Tracking">
      <SubscriptionTracking />
    </TPULayout>
  );
}