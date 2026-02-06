import React, { useState, useEffect } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { MdSearch, MdFilterList, MdOutlineInfo, MdAddCircle, MdClose, MdDelete, MdEdit } from "react-icons/md";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { usePage } from '@inertiajs/react';
import axios from 'axios';

// Subscription Tracking Component
function SubscriptionTracking() {
  const { approvedSuppliers = [] } = usePage().props;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [sortBy, setSortBy] = useState('serialTitle');
  const [loading, setLoading] = useState(true);
  
  // Add Serial Modal state
  const [showAddSerialModal, setShowAddSerialModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  
  // View Details Modal state
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [viewDetailsSubscription, setViewDetailsSubscription] = useState(null);
  
  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubscription, setEditSubscription] = useState(null);
  const [editFormData, setEditFormData] = useState({
    serialTitle: '',
    supplierName: '',
    period: '',
    awardCost: '',
    status: 'Active',
    note: '',
    issn: '',
    frequency: 'Monthly',
    authorPublisher: '',
    category: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  
  // Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSubscription, setDeleteSubscription] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  
  const [serialFormData, setSerialFormData] = useState({
    serialTitle: '',
    issn: '',
    language: 'English',
    authorPublisher: '',
    supplierName: '',
    deliveryDate: '',
    frequency: 'Biweekly',
    category: '',
    quantity: 1,
    unitPrice: '0.00'
  });
  const [serialItems, setSerialItems] = useState([]);
  
  // Subscription data state (loaded from API)
  const [subscriptions, setSubscriptions] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Suppliers loaded from localStorage (created in Supplier Info page)
  const [addedSuppliers, setAddedSuppliers] = useState([]);

  // Dropdown options for serial form
  const languageOptions = ['English', 'French', 'Spanish', 'German', 'Japanese', 'Chinese'];
  const frequencyOptions = ['Biweekly', 'Weekly', 'Monthly', 'Quarterly', 'Annually'];
  const categories = ['Science', 'Medical', 'Economics', 'Geography', 'Technology', 'Business', 'Psychology', 'Arts', 'Engineering', 'Education'];
  
  // Load suppliers from localStorage (fallback) but prioritize approved suppliers from backend
  // Also validate localStorage against approved suppliers to remove deleted ones
  useEffect(() => {
    const savedSuppliers = localStorage.getItem('tpu_suppliers');
    if (savedSuppliers) {
      const parsed = JSON.parse(savedSuppliers);
      // If we have approved suppliers from backend, filter localStorage to only valid ones
      if (approvedSuppliers.length > 0) {
        const approvedEmails = approvedSuppliers.map(s => s.email?.toLowerCase());
        const validSuppliers = parsed.filter(s => approvedEmails.includes(s.email?.toLowerCase()));
        setAddedSuppliers(validSuppliers);
        // Update localStorage if any were removed
        if (validSuppliers.length !== parsed.length) {
          if (validSuppliers.length > 0) {
            localStorage.setItem('tpu_suppliers', JSON.stringify(validSuppliers));
          } else {
            localStorage.removeItem('tpu_suppliers');
          }
        }
      } else {
        setAddedSuppliers(parsed);
      }
    }
  }, [approvedSuppliers]);
  
  // Fetch subscriptions from API on mount
  useEffect(() => {
    fetchSubscriptions();
  }, []);
  
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/subscriptions');
      if (response.data.success) {
        // Transform API data to match the component's expected format
        const apiSubscriptions = response.data.subscriptions.map(sub => ({
          id: sub._id || sub.id,
          serialTitle: sub.serial_title,
          supplierName: sub.supplier_name,
          period: sub.period,
          awardCost: `P${parseFloat(sub.award_cost || 0).toLocaleString()}`,
          deliveredCost: `P${parseFloat(sub.delivered_cost || 0).toLocaleString()}`,
          remainingCost: `P${parseFloat(sub.remaining_cost || 0).toLocaleString()}`,
          status: sub.status || 'Active',
          paymentStatus: sub.payment_status || 'Pending',
          progress: sub.progress || 0,
          note: sub.note,
          issn: sub.issn,
          frequency: sub.frequency,
          authorPublisher: sub.author_publisher,
          author_publisher: sub.author_publisher,
          category: sub.category,
          serials: sub.serials || [],
          transactions: sub.transactions || [],
        }));
        setSubscriptions(apiSubscriptions);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get supplier options - prioritize approved suppliers from backend, fallback to localStorage
  // This ensures any newly approved supplier is immediately available
  const supplierOptions = approvedSuppliers.length > 0 
    ? approvedSuppliers.map(s => s.company_name)
    : addedSuppliers.map(s => s.supplierName);

  // Use subscriptions from API
  const allSubscriptions = subscriptions;

  // Filter subscriptions
  const filteredSubscriptions = allSubscriptions.filter(subscription => {
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
    if (sortBy === 'remainingCost') {
      const aCost = parseFloat(a.remainingCost.replace(/[^0-9.]/g, '') || 0);
      const bCost = parseFloat(b.remainingCost.replace(/[^0-9.]/g, '') || 0);
      return bCost - aCost;
    }
    return 0;
  });

  // Calculate total stats
  const totalAwardCost = allSubscriptions.reduce((sum, item) => {
    const cost = parseFloat(item.awardCost.replace(/[^0-9.]/g, '') || 0);
    return sum + cost;
  }, 0);

  const totalDeliveredCost = allSubscriptions.reduce((sum, item) => {
    const cost = parseFloat(item.deliveredCost.replace(/[^0-9.]/g, '') || 0);
    return sum + cost;
  }, 0);

  const totalRemainingCost = allSubscriptions.reduce((sum, item) => {
    const cost = parseFloat(item.remainingCost.replace(/[^0-9.]/g, '') || 0);
    return sum + cost;
  }, 0);

  const paymentRate = Math.round((totalDeliveredCost / totalAwardCost) * 100);

  const stats = [
    { 
      title: 'Total Award Cost', 
      value: `P${totalAwardCost.toLocaleString()}`, 
      icon: <FiTrendingUp />,
      color: '#004A98',
      bgColor: '#E8F1FA',
      trend: 'up'
    },
    { 
      title: 'Total Delivered Cost', 
      value: `P${totalDeliveredCost.toLocaleString()}`, 
      icon: <FiTrendingUp />,
      color: '#0D9488',
      bgColor: '#E6F7F5',
      trend: 'up'
    },
    { 
      title: 'Total Remaining Cost', 
      value: `P${totalRemainingCost.toLocaleString()}`, 
      icon: totalRemainingCost > 0 ? <FiTrendingDown /> : <FiTrendingUp />,
      color: '#E67E22',
      bgColor: '#FEF3E8',
      trend: totalRemainingCost > 0 ? 'down' : 'up'
    },
  ];

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'Fully Paid': return '#d4edda';
      case 'Partially Paid': return '#fff3cd';
      case 'Overpaid': return '#cce5ff';
      default: return '#e2e3e5';
    }
  };

  const getPaymentStatusTextColor = (status) => {
    switch(status) {
      case 'Fully Paid': return '#155724';
      case 'Partially Paid': return '#856404';
      case 'Overpaid': return '#004085';
      default: return '#383d41';
    }
  };

  const handleViewDetails = (subscription) => {
    setViewDetailsSubscription(subscription);
    setShowViewDetailsModal(true);
  };

  const handleCloseViewDetailsModal = () => {
    setShowViewDetailsModal(false);
    setViewDetailsSubscription(null);
  };

  // Edit subscription handlers
  const handleEditSubscription = (subscription) => {
    setEditSubscription(subscription);
    setEditFormData({
      serialTitle: subscription.serialTitle || '',
      supplierName: subscription.supplierName || '',
      period: subscription.period || '',
      awardCost: subscription.awardCost ? subscription.awardCost.replace(/[^0-9.]/g, '') : '',
      status: subscription.status || 'Active',
      note: subscription.note || '',
      issn: subscription.issn || subscription.serials?.[0]?.issn || '',
      frequency: subscription.frequency || subscription.serials?.[0]?.frequency || 'Monthly',
      authorPublisher: subscription.authorPublisher || subscription.author_publisher || '',
      category: subscription.category || subscription.serials?.[0]?.category || ''
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditSubscription(null);
    setEditFormData({
      serialTitle: '',
      supplierName: '',
      period: '',
      awardCost: '',
      status: 'Active',
      note: '',
      issn: '',
      frequency: 'Monthly',
      authorPublisher: '',
      category: ''
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleSaveEdit = async () => {
    if (!editFormData.serialTitle || !editFormData.supplierName) {
      alert('Please fill in Serial Title and Supplier Name');
      return;
    }

    setEditSubmitting(true);
    try {
      const response = await axios.put(`/api/subscriptions/${editSubscription.id}`, {
        serial_title: editFormData.serialTitle,
        supplier_name: editFormData.supplierName,
        period: editFormData.period,
        award_cost: parseFloat(editFormData.awardCost) || 0,
        status: editFormData.status,
        note: editFormData.note,
        issn: editFormData.issn,
        frequency: editFormData.frequency,
        author_publisher: editFormData.authorPublisher,
        category: editFormData.category
      });

      if (response.data.success) {
        setSuccessMessage('Subscription updated successfully!');
        await fetchSubscriptions(); // Refresh data to reflect changes across dashboards
        handleCloseEditModal();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete subscription handlers
  const handleDeleteSubscription = (subscription) => {
    setDeleteSubscription(subscription);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteSubscription(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteSubscription) return;

    setDeleteSubmitting(true);
    try {
      const response = await axios.delete(`/api/subscriptions/${deleteSubscription.id}`);

      if (response.data.success) {
        setSuccessMessage('Subscription removed successfully!');
        await fetchSubscriptions(); // Refresh data to reflect changes across dashboards
        handleCloseDeleteModal();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert('Failed to remove subscription. Please try again.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const getSerialStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return { bg: '#d4edda', text: '#155724' };
      case 'Pending': return { bg: '#fff3cd', text: '#856404' };
      case 'Cancelled': return { bg: '#f8d7da', text: '#721c24' };
      default: return { bg: '#e2e3e5', text: '#383d41' };
    }
  };

  const getTransactionStatusColor = (status) => {
    switch(status) {
      case 'Completed': return { bg: '#d4edda', text: '#155724' };
      case 'Pending': return { bg: '#fff3cd', text: '#856404' };
      case 'Failed': return { bg: '#f8d7da', text: '#721c24' };
      default: return { bg: '#e2e3e5', text: '#383d41' };
    }
  };

  // Add Serial handlers
  const handleOpenAddSerialModal = (subscription) => {
    setSelectedSubscription(subscription);
    setSerialItems([]);
    setShowAddSerialModal(true);
  };

  const handleCloseAddSerialModal = () => {
    setShowAddSerialModal(false);
    setSelectedSubscription(null);
    setSerialFormData({
      serialTitle: '',
      issn: '',
      language: 'English',
      authorPublisher: '',
      supplierName: '',
      deliveryDate: '',
      frequency: 'Biweekly',
      category: '',
      quantity: 1,
      unitPrice: '0.00'
    });
    setSerialItems([]);
  };

  const handleSerialInputChange = (e) => {
    const { name, value } = e.target;
    setSerialFormData({ ...serialFormData, [name]: value });
  };

  const handleAddSerialItem = () => {
    if (!serialFormData.serialTitle || !serialFormData.issn || !serialFormData.supplierName || !serialFormData.deliveryDate) {
      alert('Please fill in all required fields (Serial Title, ISSN, Supplier Name, Delivery Date)');
      return;
    }

    const newItem = {
      id: Date.now(),
      ...serialFormData,
      totalPrice: (serialFormData.quantity * (parseFloat(serialFormData.unitPrice) || 0)).toFixed(2)
    };
    setSerialItems([...serialItems, newItem]);

    setSerialFormData({
      serialTitle: '',
      issn: '',
      language: 'English',
      authorPublisher: '',
      supplierName: '',
      deliveryDate: '',
      frequency: 'Biweekly',
      category: '',
      quantity: 1,
      unitPrice: '0.00'
    });
  };

  const handleDeleteSerialItem = (id) => {
    setSerialItems(serialItems.filter(item => item.id !== id));
  };

  const handleSaveSerials = async () => {
    if (serialItems.length === 0) {
      alert('Please add at least one serial item');
      return;
    }
    
    setSubmitting(true);
    
    // Group serial items by supplier to create subscriptions
    const supplierGroups = {};
    serialItems.forEach(item => {
      if (!supplierGroups[item.supplierName]) {
        supplierGroups[item.supplierName] = [];
      }
      supplierGroups[item.supplierName].push(item);
    });
    
    try {
      // Create subscription entries for each supplier group via API
      const createdSubscriptions = [];
      
      for (const [supplierName, items] of Object.entries(supplierGroups)) {
        const totalCost = items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.unitPrice || 0)), 0);
        const firstItem = items[0];
        
        const subscriptionData = {
          serial_title: items.length === 1 ? firstItem.serialTitle : `${items.length} Serials`,
          supplier_name: supplierName,
          period: firstItem.deliveryDate || new Date().toISOString().split('T')[0],
          award_cost: totalCost,
          delivered_cost: 0,
          serials: items.map(item => ({
            id: item.id,
            serialTitle: item.serialTitle,
            title: item.serialTitle,
            issn: item.issn,
            frequency: item.frequency,
            status: 'pending',
            deliveryDate: item.deliveryDate || null,
            language: item.language,
            category: item.category,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          transactions: [
            { 
              id: 1, 
              date: new Date().toISOString().split('T')[0], 
              type: 'Subscription Created', 
              amount: `P${totalCost.toLocaleString()}`, 
              status: 'Pending' 
            }
          ],
        };
        
        const response = await axios.post('/api/subscriptions', subscriptionData);
        if (response.data.success) {
          createdSubscriptions.push(response.data.subscription);
        }
      }
      
      // Refresh subscriptions from API
      await fetchSubscriptions();
      
      setSuccessMessage(`Successfully added ${serialItems.length} serial(s) as ${createdSubscriptions.length} subscription(s)`);
      handleCloseAddSerialModal();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to create subscription. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
    <div style={{ background: '#fff', minHeight: 'calc(100vh - 73px)', padding: '24px 32px' }}>
      {/* Success Message */}
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
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              background: stat.bgColor,
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${stat.color}`,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0', fontWeight: 500 }}>
                  {stat.title}
                </h3>
                <p style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  margin: 0,
                  color: stat.color
                }}>
                  {stat.value}
                </p>
              </div>
              <div style={{
                color: stat.color,
                fontSize: 24,
                opacity: 0.8
              }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#004A98', margin: 0, fontSize: 20 }}>Subscription Details</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={fetchSubscriptions}
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
              }}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowAddSerialModal(true)}
              style={{
                background: '#28a745',
                border: 'none',
                color: '#fff',
                padding: '12px 20px',
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
              <option value="All">All Dates</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
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
              <option value="remainingCost">Sort by Remaining Cost</option>
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
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Delivery Date</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Award Cost</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                    Loading subscriptions...
                  </td>
                </tr>
              )}
              {!loading && sortedSubscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                    No subscriptions found. Click "Add Serial" to create your first subscription.
                  </td>
                </tr>
              )}
              {!loading && sortedSubscriptions.map((subscription) => (
                <tr key={subscription.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>{subscription.serialTitle}</td>
                  <td style={{ padding: '16px' }}>{subscription.supplierName}</td>
                  <td style={{ padding: '16px', color: '#666' }}>{subscription.period ? new Date(subscription.period).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: '#004A98' }}>{subscription.awardCost}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: 20,
                      background: '#d4edda',
                      color: '#155724',
                      fontSize: 12,
                      fontWeight: 500,
                    }}>
                      {subscription.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleViewDetails(subscription)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #004A98',
                          color: '#004A98',
                          padding: '8px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
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
                      <button
                        onClick={() => handleEditSubscription(subscription)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #E67E22',
                          color: '#E67E22',
                          padding: '8px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#E67E22';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#E67E22';
                        }}
                      >
                        <MdEdit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSubscription(subscription)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #dc3545',
                          color: '#dc3545',
                          padding: '8px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#dc3545';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#dc3545';
                        }}
                      >
                        <MdDelete size={14} /> Remove
                      </button>
                    </div>
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
            Showing {sortedSubscriptions.length} of {allSubscriptions.length} results
            {subscriptions.length > 0 && ` (${subscriptions.length} added)`}
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
              marginBottom: '8px'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#004A98', 
                fontSize: '22px', 
                fontWeight: '600'
              }}>
                Add Serial
              </h2>
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
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px' }}>
              Fill in the serial details below to add to the subscription list
            </p>

            {/* Add Serial Form */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#333' }}>Serial Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Serial Title *</label>
                  <input
                    type="text"
                    name="serialTitle"
                    value={serialFormData.serialTitle}
                    onChange={handleSerialInputChange}
                    placeholder="Enter serial title"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>ISSN *</label>
                  <input
                    type="text"
                    name="issn"
                    value={serialFormData.issn}
                    onChange={handleSerialInputChange}
                    placeholder="e.g., 0028-0836"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Language</label>
                  <select
                    name="language"
                    value={serialFormData.language}
                    onChange={handleSerialInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
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
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Author/Publisher</label>
                  <input
                    type="text"
                    name="authorPublisher"
                    value={serialFormData.authorPublisher}
                    onChange={handleSerialInputChange}
                    placeholder="Enter author/publisher"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Supplier Name *</label>
                  <select
                    name="supplierName"
                    value={serialFormData.supplierName}
                    onChange={handleSerialInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: supplierOptions.length === 0 ? '1px solid #f5c6cb' : '1px solid #ddd',
                      fontSize: '14px',
                      background: supplierOptions.length === 0 ? '#fff3f3' : '#fff'
                    }}
                  >
                    {supplierOptions.length === 0 ? (
                      <option value="">No suppliers available - Add suppliers first</option>
                    ) : (
                      <>
                        <option value="">Select Supplier</option>
                        {supplierOptions.map(supplier => (
                          <option key={supplier} value={supplier}>{supplier}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {supplierOptions.length === 0 && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#dc3545' }}>
                      Please add suppliers in the Supplier Information page first.
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Delivery Date *</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={serialFormData.deliveryDate}
                    onChange={handleSerialInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Frequency</label>
                  <select
                    name="frequency"
                    value={serialFormData.frequency}
                    onChange={handleSerialInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
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
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Category</label>
                  <select
                    name="category"
                    value={serialFormData.category}
                    onChange={handleSerialInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
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
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={serialFormData.quantity}
                    onChange={handleSerialInputChange}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Unit Price (₱)</label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={serialFormData.unitPrice}
                    onChange={handleSerialInputChange}
                    placeholder="0.00"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleAddSerialItem}
                  style={{
                    padding: '12px 24px',
                    background: '#004A98',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <MdAddCircle size={18} /> Confirm
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
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Delivery Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Qty</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Unit Price</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serialItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{item.serialTitle}</td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>{item.issn}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{item.supplierName}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{item.quantity}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>₱{parseFloat(item.unitPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
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
                  padding: '12px 28px',
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#333'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSerials}
                disabled={serialItems.length === 0}
                style={{
                  padding: '12px 28px',
                  background: serialItems.length > 0 ? '#004A98' : '#ccc',
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
      {showViewDetailsModal && viewDetailsSubscription && (
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
              marginBottom: '8px'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#004A98', 
                fontSize: '22px', 
                fontWeight: '600'
              }}>
                {viewDetailsSubscription.serialTitle}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  background: '#d4edda',
                  color: '#155724',
                  fontSize: 13,
                  fontWeight: 500,
                }}>
                  {viewDetailsSubscription.status}
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
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px' }}>
              Serial Subscription Details
            </p>

            {/* Serial Information Section */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#004A98' }}>Serial Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>ISSN</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '600', color: '#333' }}>
                    {viewDetailsSubscription.serials?.[0]?.issn || '1234-5678'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Supplier</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '500', color: '#333' }}>
                    {viewDetailsSubscription.supplierName}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Publisher</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '500', color: '#333' }}>
                    {viewDetailsSubscription.publisher || `${viewDetailsSubscription.serialTitle} Publishers`}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Language</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '600', color: '#333' }}>
                    {viewDetailsSubscription.language || 'English'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Frequency</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '600', color: '#333' }}>
                    {viewDetailsSubscription.serials?.[0]?.frequency || 'Quarterly'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Category</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '600', color: '#333' }}>
                    {viewDetailsSubscription.category || 'Economics'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Delivery Date</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '600', color: '#333' }}>
                    {viewDetailsSubscription.period ? new Date(viewDetailsSubscription.period).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Award Cost</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '700', color: '#004A98' }}>
                    {viewDetailsSubscription.awardCost}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Date Added</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '600', color: '#333' }}>
                    {viewDetailsSubscription.dateAdded || viewDetailsSubscription.transactions?.[0]?.date || '2025-01-08'}
                  </p>
                </div>
              </div>
            </div>

            {/*  History Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#004A98' }}>
                 History
              </h3>
              {viewDetailsSubscription.transactions && viewDetailsSubscription.transactions.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd', color: '#333' }}>Date</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd', color: '#333' }}>Type</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd', color: '#333' }}>Amount</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #ddd', color: '#333' }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewDetailsSubscription.transactions.map((transaction) => (
                        <tr key={transaction.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '14px 16px', fontSize: '14px', color: '#666' }}>{transaction.date}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '5px 14px',
                              borderRadius: 20,
                              background: '#cce5ff',
                              color: '#004085',
                              fontSize: 12,
                              fontWeight: 500,
                            }}>
                              {transaction.type === 'Payment' ? 'Subscription Created' : transaction.type}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#004A98' }}>{transaction.amount}</td>
                          <td style={{ padding: '14px 16px', fontSize: '14px', color: '#666' }}>
                            {transaction.description || transaction.note || 'Initial subscription'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#666', fontSize: '14px' }}>No transactions available for this subscription.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '20px',
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

      {/* Edit Subscription Modal */}
      {showEditModal && editSubscription && (
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
              marginBottom: '8px'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#E67E22', 
                fontSize: '22px', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <MdEdit size={24} /> Edit Subscription
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
                <MdClose />
              </button>
            </div>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px' }}>
              Update the subscription details below
            </p>

            {/* Edit Form */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Serial Title *</label>
                  <input
                    type="text"
                    name="serialTitle"
                    value={editFormData.serialTitle}
                    onChange={handleEditInputChange}
                    placeholder="Enter serial title"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>ISSN</label>
                  <input
                    type="text"
                    name="issn"
                    value={editFormData.issn}
                    onChange={handleEditInputChange}
                    placeholder="e.g., 0028-0836"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Supplier Name *</label>
                  <select
                    name="supplierName"
                    value={editFormData.supplierName}
                    onChange={handleEditInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
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
                    {/* Keep current supplier if not in list */}
                    {editFormData.supplierName && !supplierOptions.includes(editFormData.supplierName) && (
                      <option value={editFormData.supplierName}>{editFormData.supplierName}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Author/Publisher</label>
                  <input
                    type="text"
                    name="authorPublisher"
                    value={editFormData.authorPublisher}
                    onChange={handleEditInputChange}
                    placeholder="Enter author/publisher"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Frequency</label>
                  <select
                    name="frequency"
                    value={editFormData.frequency}
                    onChange={handleEditInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
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
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Category</label>
                  <select
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
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
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Delivery Date</label>
                  <input
                    type="date"
                    name="period"
                    value={editFormData.period}
                    onChange={handleEditInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Award Cost (₱)</label>
                  <input
                    type="number"
                    name="awardCost"
                    value={editFormData.awardCost}
                    onChange={handleEditInputChange}
                    placeholder="0.00"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Status</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff'
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 3' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Notes</label>
                  <textarea
                    name="note"
                    value={editFormData.note}
                    onChange={handleEditInputChange}
                    placeholder="Add any notes about this subscription..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      background: '#fff',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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
                  padding: '12px 28px',
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#333'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSubmitting}
                style={{
                  padding: '12px 28px',
                  background: editSubmitting ? '#ccc' : '#E67E22',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: editSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteSubscription && (
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
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center'
          }}>
            {/* Warning Icon */}
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <MdDelete size={32} style={{ color: '#dc3545' }} />
            </div>

            {/* Modal Header */}
            <h2 style={{ 
              margin: '0 0 12px 0', 
              color: '#dc3545', 
              fontSize: '22px', 
              fontWeight: '600'
            }}>
              Remove Subscription
            </h2>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
              Are you sure you want to remove this subscription?
            </p>
            <p style={{ 
              margin: '0 0 24px 0', 
              color: '#333', 
              fontSize: '16px',
              fontWeight: '600',
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '6px'
            }}>
              "{deleteSubscription.serialTitle}"
            </p>
            <p style={{ margin: '0 0 24px 0', color: '#999', fontSize: '13px' }}>
              This action cannot be undone. The subscription will be permanently removed from all dashboards.
            </p>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <button
                onClick={handleCloseDeleteModal}
                disabled={deleteSubmitting}
                style={{
                  padding: '12px 28px',
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: deleteSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: '#333'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteSubmitting}
                style={{
                  padding: '12px 28px',
                  background: deleteSubmitting ? '#ccc' : '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: deleteSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MdDelete size={16} />
                {deleteSubmitting ? 'Removing...' : 'Yes, Remove'}
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
    <TPULayout hideTitle={true}>
      <SubscriptionTracking />
    </TPULayout>
  );
}