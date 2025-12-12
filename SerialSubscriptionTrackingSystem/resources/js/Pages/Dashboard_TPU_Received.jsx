import React, { useState } from 'react';
import { GoHomeFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { ImStatsBars } from "react-icons/im";
import { FaTruck } from "react-icons/fa";
import { MdMarkEmailRead } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { RiAddLargeFill } from "react-icons/ri";
import { MdSearch, MdFilterList, MdFileDownload, MdCheckCircle, MdPendingActions } from "react-icons/md";
import { FaCalendarAlt, FaUserCheck } from "react-icons/fa";

const Icon = ({ children }) => (
  <span style={{ marginRight: 8 }}>{children}</span>
);

const sidebarItems = [
  { icon: <GoHomeFill />, label: 'Dashboard' },
  { icon: <RiAddLargeFill />, label: 'Add Serial' },
  { icon: <HiUsers />, label: 'Supplier Info' },
  { icon: <ImStatsBars />, label: 'Subscription' },
  { icon: <FaTruck />, label: 'Monitor Delivery' },
  { icon: <MdMarkEmailRead />, label: 'Received' },
];

// Received Items Component
function ReceivedItems() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');

  // Received items data from your image
  const receivedData = [
    {
      id: 1,
      serialTitle: 'Nature',
      supplierName: 'ABC Books Supplier',
      volumeIssue: 'Vol 2 Issue 24',
      dateReceived: 'June 1, 2025',
      receivedBy: 'M. Santos',
      inspectionStatus: 'Inspected',
      notes: '',
      priority: 'High'
    },
    {
      id: 2,
      serialTitle: 'The Lancet',
      supplierName: 'MedJournal Suppliers Inc.',
      volumeIssue: 'Vol 1 Issue 12',
      dateReceived: 'June 15, 2025',
      receivedBy: 'L. Cruz',
      inspectionStatus: 'Inspected',
      notes: 'Complete set received',
      priority: 'Medium'
    },
    {
      id: 3,
      serialTitle: 'Science',
      supplierName: 'Global Periodicals Co.',
      volumeIssue: 'Vol 3 Issue 8',
      dateReceived: 'June 19, 2025',
      receivedBy: 'L. Cruz',
      inspectionStatus: 'Pending',
      notes: 'Awaiting quality check',
      priority: 'High'
    },
    {
      id: 4,
      serialTitle: 'Asian Economic Review',
      supplierName: 'EastAsia Books & Journals',
      volumeIssue: 'Vol 1 Issue 4',
      dateReceived: 'April 20, 2025',
      receivedBy: 'J. Ramos',
      inspectionStatus: 'Inspected',
      notes: 'Archived',
      priority: 'Low'
    },
    {
      id: 5,
      serialTitle: 'Medical Digest',
      supplierName: 'MedJournal Suppliers Inc.',
      volumeIssue: 'Vol 2 Issue 15',
      dateReceived: 'June 18, 2025',
      receivedBy: 'K. Dela Rosa',
      inspectionStatus: 'Inspected',
      notes: 'Ready for distribution',
      priority: 'Medium'
    },
  ];

  // Filter received items
  const filteredItems = receivedData.filter(item => {
    const matchesSearch = 
      item.serialTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.receivedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || item.inspectionStatus === statusFilter;
    
    // Simple date matching (in real app would parse dates properly)
    const matchesDate = !dateFilter || item.dateReceived.includes(dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'date') {
      // Simple date sort (in real app would parse dates properly)
      return new Date(b.dateReceived) - new Date(a.dateReceived);
    }
    if (sortBy === 'title') return a.serialTitle.localeCompare(b.serialTitle);
    if (sortBy === 'status') return a.inspectionStatus.localeCompare(b.inspectionStatus);
    return 0;
  });

  // Calculate stats
  const totalReceived = receivedData.length;
  const totalInspected = receivedData.filter(item => item.inspectionStatus === 'Inspected').length;
  const totalPending = receivedData.filter(item => item.inspectionStatus === 'Pending').length;

  const stats = [
    { 
      title: 'Total Received', 
      value: totalReceived, 
      icon: <MdMarkEmailRead />,
      color: '#004A98',
      description: 'Total items received'
    },
    { 
      title: 'Inspected', 
      value: totalInspected, 
      icon: <MdCheckCircle />,
      color: '#28a745',
      description: 'Items inspected'
    },
    { 
      title: 'Pending', 
      value: totalPending, 
      icon: <MdPendingActions />,
      color: '#ffc107',
      description: 'Items pending inspection'
    },
    { 
      title: 'Inspection Rate', 
      value: `${Math.round((totalInspected / totalReceived) * 100)}%`, 
      icon: <FaUserCheck />,
      color: '#17a2b8',
      description: 'Completion rate'
    },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Inspected': return '#d4edda';
      case 'Pending': return '#fff3cd';
      default: return '#e2e3e5';
    }
  };

  const getStatusTextColor = (status) => {
    switch(status) {
      case 'Inspected': return '#155724';
      case 'Pending': return '#856404';
      default: return '#383d41';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return '#dc3545';
      case 'Medium': return '#ffc107';
      case 'Low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const handleMarkInspected = (id) => {
    if (window.confirm('Mark this item as inspected?')) {
      alert(`Item ${id} marked as inspected. In a real app, this would update the database.`);
    }
  };

  const handleViewDetails = (id) => {
    alert(`Viewing details for received item ID: ${id}`);
  };

  const handleExportLog = () => {
    alert('Exporting received items log...');
  };

  const handleAddReceived = () => {
    alert('Opening form to add new received item...');
  };

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h2 style={{ color: '#004A98', margin: '0 0 8px 0', fontSize: 24 }}>Received Items</h2>
        <p style={{ color: '#666', margin: 0, fontSize: 16 }}>Track and manage all received serial items</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 30 }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              borderTop: `4px solid ${stat.color}`,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0', fontWeight: 500 }}>
                  {stat.title}
                </h3>
                <p style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  margin: 0,
                  color: stat.color
                }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 12, color: '#666', marginTop: 8, marginBottom: 0 }}>
                  {stat.description}
                </p>
              </div>
              <div style={{
                color: stat.color,
                fontSize: 28,
                opacity: 0.8
              }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#004A98', margin: 0, fontSize: 20 }}>Received Items Log</h2>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleAddReceived}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <RiAddLargeFill /> Add Received Item
            </button>
            <button
              onClick={handleExportLog}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: '#004A98',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <MdFileDownload /> Export Log
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search received items..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14,
                background: '#fff',
                minWidth: 150,
              }}
            >
              <option value="All">All Status</option>
              <option value="Inspected">Inspected</option>
              <option value="Pending">Pending</option>
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
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="status">Sort by Status</option>
            </select>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Month filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 14,
                  background: '#fff',
                  width: 150,
                }}
              />
              <FaCalendarAlt style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666',
                pointerEvents: 'none'
              }} />
            </div>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setDateFilter('');
                setSortBy('date');
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

        {/* Received Items Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Serial Title</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Supplier Name</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Volume/Issue</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Date Received</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Received By</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Inspection Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.serialTitle}
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: getPriorityColor(item.priority),
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}>
                        {item.priority.charAt(0)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>{item.supplierName}</td>
                  <td style={{ padding: '16px', fontFamily: 'monospace', color: '#004A98', fontWeight: 500 }}>
                    {item.volumeIssue}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaCalendarAlt style={{ color: '#666', fontSize: 14 }} />
                      {item.dateReceived}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#004A98',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}>
                        {item.receivedBy.charAt(0)}
                      </div>
                      {item.receivedBy}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{
                        padding: '6px 16px',
                        borderRadius: 20,
                        background: getStatusColor(item.inspectionStatus),
                        color: getStatusTextColor(item.inspectionStatus),
                        fontSize: 12,
                        fontWeight: 500,
                        display: 'inline-block',
                        width: 'fit-content',
                      }}>
                        {item.inspectionStatus === 'Inspected' ? (
                          <>
                            <MdCheckCircle style={{ marginRight: 6, verticalAlign: 'middle' }} />
                            {item.inspectionStatus}
                          </>
                        ) : (
                          <>
                            <MdPendingActions style={{ marginRight: 6, verticalAlign: 'middle' }} />
                            {item.inspectionStatus}
                          </>
                        )}
                      </span>
                      {item.notes && (
                        <span style={{ fontSize: 11, color: '#666', fontStyle: 'italic' }}>
                          {item.notes}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {item.inspectionStatus === 'Pending' && (
                        <button
                          onClick={() => handleMarkInspected(item.id)}
                          style={{
                            background: '#28a745',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <MdCheckCircle /> Mark Inspected
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetails(item.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #004A98',
                          color: '#004A98',
                          padding: '8px 16px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div style={{ 
          marginTop: 30, 
          paddingTop: 20, 
          borderTop: '1px solid #eee',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <div style={{ color: '#666', fontSize: 14 }}>
              Showing {sortedItems.length} of {receivedData.length} results
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ 
              padding: '8px 16px', 
              background: '#f8f9fa', 
              borderRadius: 6,
              fontSize: 14,
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <div style={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                background: '#28a745' 
              }} />
              Inspected: {totalInspected}
            </div>
            <div style={{ 
              padding: '8px 16px', 
              background: '#f8f9fa', 
              borderRadius: 6,
              fontSize: 14,
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <div style={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                background: '#ffc107' 
              }} />
              Pending: {totalPending}
            </div>
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
    </div>
  );
}

function Sidebar({ active, setActive }) {
  return (
    <div style={{
      background: '#004A98',
      color: '#fff',
      width: 160,
      minHeight: '100vh',
      padding: '20px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <img
        src="/images/dost-logo1.png"
        alt="LOGO"
        style={{
          marginBottom: 24,
          width: 55,
          height: 55,
          borderRadius: 12
        }}
      />
      <nav style={{ width: '100%' }}>
        <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
          {sidebarItems.map((item, idx) => (
            <li
              key={item.label}
              style={{
                margin: '10px 0',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 500,
                color: '#fff',
                background: active === idx ? '#0062f4ff' : 'transparent',
                borderRadius: 6,
                padding: '8px 12px',
                width: '140px',
                marginLeft: '10px',
                transition: 'background 0.2s, transform 0.1s',
                boxShadow: active === idx ? '0 3px 6px rgba(0,0,0,0.15)' : 'none'
              }}
              onClick={() => setActive(idx)}
            >
              <Icon>{item.icon}</Icon>
              <span style={{ fontSize: 15 }}>{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function TopBar() {
  const [activeIcon, setActiveIcon] = useState(null);

  const handleIconClick = (icon) => {
    setActiveIcon(activeIcon === icon ? null : icon);
  };

  const popupStyle = {
    position: 'absolute',
    top: 60,
    right: 20,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
    padding: 16,
    width: 260,
    zIndex: 10,
  };

  return (
    <div
      style={{
        fontSize: 22,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 32px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 9
      }}
    >
      <h2 style={{ color: '#004A98', fontWeight: 600, fontSize: 20 }}>Serial Subscription Tracking System</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
        <span onClick={() => handleIconClick('chat')} style={{ cursor: 'pointer' }}>
          <IoChatboxEllipsesOutline />
        </span>
        {activeIcon === 'chat' && (
          <div style={popupStyle}>
            <h4 style={{ margin: '0 0 8px' }}>Messages</h4>
            <p style={{ fontSize: 14, color: '#555' }}>No new messages.</p>
          </div>
        )}

        <span onClick={() => handleIconClick('notifications')} style={{ cursor: 'pointer' }}>
          <MdOutlineNotificationsActive />
        </span>
        {activeIcon === 'notifications' && (
          <div style={popupStyle}>
            <h4 style={{ margin: '0 0 8px' }}>Notifications</h4>
            <p style={{ fontSize: 14, color: '#555' }}>You're all caught up!</p>
          </div>
        )}

        <span onClick={() => handleIconClick('account')} style={{ cursor: 'pointer', position: 'relative' }}>
          <VscAccount size={22} />
          
          {activeIcon === 'account' && (
            <div
              style={{
                position: 'absolute',
                top: '35px',
                right: 0,
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                width: 200,
                padding: '16px 18px',
                zIndex: 100,
                transition: 'all 0.2s ease',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#004A98',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    marginRight: 10,
                  }}
                >
                  A
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, color: '#222' }}>Admin</h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#777' }}>System Administrator</p>
                </div>
              </div>

              <button
                style={{
                  width: '100%',
                  background: '#004A98',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 0',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'background 0.2s ease',
                }}
                onMouseOver={(e) => (e.target.style.background = '#003C7A')}
                onMouseOut={(e) => (e.target.style.background = '#004A98')}
              >
                Logout
              </button>
            </div>
          )}
        </span>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function App() {
  const [activeSidebar, setActiveSidebar] = useState(5); // Default to Received (index 5)

  const renderContent = () => {
    switch (activeSidebar) {
      case 0: // Dashboard
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Dashboard Overview</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>{getGreeting()} Welcome back!</p>
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <h3>Dashboard View</h3>
              <p>Select other sidebar items to view different sections</p>
            </div>
          </>
        );
      case 2: // Supplier Info
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Supplier Information</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Manage and view all supplier details</p>
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <h3>Supplier Info View</h3>
              <p>This would show your supplier information table</p>
            </div>
          </>
        );
      case 3: // Subscription Tracking
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Subscription Tracking</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Monitor and manage subscription payments</p>
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <h3>Subscription View</h3>
              <p>This would show your subscription tracking table</p>
            </div>
          </>
        );
      case 4: // Monitor Delivery
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Monitor Delivery</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Track and monitor all delivery activities</p>
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <h3>Monitor Delivery View</h3>
              <p>This would show your delivery monitoring table</p>
            </div>
          </>
        );
      case 5: // Received Items
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Received Items</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Track received serial items and inspection status</p>
            <ReceivedItems />
          </>
        );
      default:
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>{sidebarItems[activeSidebar].label}</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Content for {sidebarItems[activeSidebar].label} section</p>
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, color: '#666' }}>
              <h3>{sidebarItems[activeSidebar].label} View</h3>
              <p>This section is under development</p>
            </div>
          </>
        );
    }
  };

  return (
    <div style={{ display: 'flex', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f0f4f8', minHeight: '100vh' }}>
      <Sidebar active={activeSidebar} setActive={setActiveSidebar} />
      <div style={{ flex: 1 }}>
        <TopBar />
        <div style={{ padding: '32px 40px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;

console.log("Received Items Dashboard loaded ✅");