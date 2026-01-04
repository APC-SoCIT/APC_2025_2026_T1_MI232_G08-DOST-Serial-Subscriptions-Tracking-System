import React, { useState } from 'react';
import GSPSLayout from '@/Layouts/GSPSLayout';
import { 
  MdSearch, MdFilterList, MdFileDownload,
  MdCheckCircle, MdCancel, MdWarning, MdInfo,
  MdCalendarToday, MdVisibility, MdAssignment
} from "react-icons/md";
import { FiClock } from "react-icons/fi";

// Inspection Status Component for GSPS Role
function InspectionStatusGSPS() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Dummy inspection data - Updated status names
  const inspectionData = [
    {
      id: 1,
      serialTitle: 'Nature',
      volumeIssue: 'Vol 3 Issue 9',
      supplierName: 'ABC Books Supplier',
      dateReceived: '2025-12-15',
      inspectionDate: '2025-12-16',
      inspector: 'John Smith',
      status: 'No Issues', // Was 'Passed' -> 'Inspected' -> now 'No Issues'
      condition: 'Excellent',
      notes: 'All pages intact, no damage',
      issues: 0,
      category: 'Science'
    },
    {
      id: 2,
      serialTitle: 'Science',
      volumeIssue: 'Vol 4 Issue 1',
      supplierName: 'Global Periodicals Co.',
      dateReceived: '2025-12-10',
      inspectionDate: '2025-12-11',
      inspector: 'Maria Garcia',
      status: 'With Issues', // Was 'Failed' -> 'Inspected' -> now 'With Issues'
      condition: 'Poor',
      notes: 'Missing pages 15-18, water damage on cover',
      issues: 4,
      category: 'Science'
    },
    {
      id: 3,
      serialTitle: 'The Lancet',
      volumeIssue: 'Vol 2 Issue 12',
      supplierName: 'MedJournal Suppliers Inc.',
      dateReceived: '2025-12-05',
      inspectionDate: null,
      inspector: null,
      status: 'To be Inspected', // Remains the same
      condition: 'N/A',
      notes: 'Awaiting inspection',
      issues: 0,
      category: 'Medical'
    },
    {
      id: 4,
      serialTitle: 'National Geographic',
      volumeIssue: 'Vol 5 Issue 1',
      supplierName: 'Global Periodicals Co.',
      dateReceived: '2025-12-18',
      inspectionDate: '2025-12-20',
      inspector: 'Sarah Johnson',
      status: 'With Issues', // Was 'Inspected' -> now 'With Issues'
      condition: 'Good',
      notes: 'Minor corner damage, content complete',
      issues: 1,
      category: 'Geography'
    },
    {
      id: 5,
      serialTitle: 'Harvard Business Review',
      volumeIssue: 'Vol 6 Issue 11',
      supplierName: 'Business Publications Inc.',
      dateReceived: '2025-12-12',
      inspectionDate: '2025-12-14',
      inspector: 'Michael Brown',
      status: 'No Issues', // Was 'Passed' -> 'Inspected' -> now 'No Issues'
      condition: 'Fair',
      notes: 'Late delivery, but content intact',
      issues: 0,
      category: 'Business'
    },
    {
      id: 6,
      serialTitle: 'Journal of Medicine',
      volumeIssue: 'Vol 3 Issue 8',
      supplierName: 'Medical Publications Ltd',
      dateReceived: '2025-12-08',
      inspectionDate: '2025-12-09',
      inspector: 'Lisa Wang',
      status: 'No Issues', // Was 'Passed' -> 'Inspected' -> now 'No Issues'
      condition: 'Excellent',
      notes: 'Perfect condition, delivered on time',
      issues: 0,
      category: 'Medical'
    },
    {
      id: 7,
      serialTitle: 'Physics Today',
      volumeIssue: 'Vol 4 Issue 5',
      supplierName: 'Science Publishers Ltd',
      dateReceived: '2025-12-20',
      inspectionDate: null,
      inspector: null,
      status: 'To be Inspected', // Remains the same
      condition: 'N/A',
      notes: 'Inspection scheduled for Dec 23',
      issues: 0,
      category: 'Physics'
    },
    {
      id: 8,
      serialTitle: 'Economist',
      volumeIssue: 'Vol 5 Issue 10',
      supplierName: 'Business Publications Inc.',
      dateReceived: '2025-12-14',
      inspectionDate: '2025-12-15',
      inspector: 'David Lee',
      status: 'With Issues', // Was 'Failed' -> 'Inspected' -> now 'With Issues'
      condition: 'Poor',
      notes: 'Incomplete issue, missing sections',
      issues: 3,
      category: 'Economics'
    },
    {
      id: 9,
      serialTitle: 'Art Review',
      volumeIssue: 'Vol 2 Issue 7',
      supplierName: 'Creative Publications',
      dateReceived: '2025-12-06',
      inspectionDate: '2025-12-08',
      inspector: 'Emma Wilson',
      status: 'With Issues', // Was 'Inspected' -> now 'With Issues'
      condition: 'Good',
      notes: 'Minor cover wear, content excellent',
      issues: 1,
      category: 'Arts'
    },
    {
      id: 10,
      serialTitle: 'Scientific American',
      volumeIssue: 'Vol 6 Issue 3',
      supplierName: 'Tech Publications Ltd',
      dateReceived: '2025-12-19',
      inspectionDate: null,
      inspector: null,
      status: 'To be Inspected', // Remains the same
      condition: 'N/A',
      notes: 'Awaiting inspector assignment',
      issues: 0,
      category: 'Technology'
    }
  ];

  // Calculate stats - Updated for new status categories
  const totalInspections = inspectionData.length;
  const noIssuesItems = inspectionData.filter(i => i.status === 'No Issues').length;
  const withIssuesItems = inspectionData.filter(i => i.status === 'With Issues').length;
  const toBeInspectedItems = inspectionData.filter(i => i.status === 'To be Inspected').length;

  // Filter inspections
  const filteredInspections = inspectionData.filter(inspection => {
    const matchesSearch = 
      inspection.serialTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.volumeIssue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.inspector?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || inspection.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Status color helper - Updated for new statuses
  const getStatusColor = (status) => {
    switch(status) {
      case 'No Issues': return '#28a745'; // Green
      case 'With Issues': return '#dc3545'; // Red
      case 'To be Inspected': return '#ffc107'; // Yellow
      default: return '#999';
    }
  };

  // Condition color helper
  const getConditionColor = (condition) => {
    switch(condition) {
      case 'Excellent': return '#28a745';
      case 'Good': return '#17a2b8';
      case 'Fair': return '#ffc107';
      case 'Poor': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Category color helper
  const getCategoryColor = (category) => {
    const colors = {
      'Science': '#004A98',
      'Medical': '#dc3545',
      'Business': '#6f42c1',
      'Geography': '#28a745',
      'Physics': '#20c997',
      'Economics': '#ffc107',
      'Arts': '#fd7e14',
      'Technology': '#17a2b8'
    };
    return colors[category] || '#999';
  };

  // Handle actions
  const handleMarkInspected = (id) => {
    if (window.confirm('Mark this item as inspected?')) {
      alert(`Item ${id} marked as inspected.`);
    }
  };

  const handleViewDetails = (inspection) => {
    setSelectedInspection(inspection);
    setShowDetailsModal(true);
  };

  // Inspection Card Component for Grid View
  const InspectionCard = ({ inspection }) => {
    const statusColor = getStatusColor(inspection.status);
    
    return (
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: selectedInspection?.id === inspection.id ? '2px solid #004A98' : '1px solid #e0e0e0',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }} onClick={() => handleViewDetails(inspection)}>
        {/* Card Header - Removed status badge from top */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#004A98', fontSize: 18, lineHeight: '1.3' }}>
              {inspection.serialTitle}
            </h3>
            <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
              {inspection.volumeIssue}
            </p>
          </div>
        </div>
        
        {/* Card Body */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 6px 0', fontSize: 14, color: '#666' }}>
              <strong>Supplier:</strong> {inspection.supplierName}
            </p>
            <p style={{ margin: '0 0 6px 0', fontSize: 14, color: '#666' }}>
              <strong>Received:</strong> {inspection.dateReceived}
            </p>
            <p style={{ margin: '0 0 6px 0', fontSize: 14, color: '#666' }}>
              <strong>Inspector:</strong> {inspection.inspector || 'Not assigned'}
            </p>
          </div>
          
          {/* Issues */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid #eee'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 'bold',
                color: inspection.issues > 0 ? '#dc3545' : '#28a745'
              }}>
                {inspection.issues} issue{inspection.issues !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>Issues found</div>
            </div>
            <span style={{
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
              background: getCategoryColor(inspection.category) + '20',
              color: getCategoryColor(inspection.category),
              border: `1px solid ${getCategoryColor(inspection.category)}`
            }}>
              {inspection.category}
            </span>
          </div>
        </div>
        
        {/* Card Footer - Shows status here instead of top */}
        <div style={{ 
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 14, color: statusColor, fontWeight: 600 }}>
            {inspection.status}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(inspection);
            }}
            style={{
              padding: '6px 12px',
              background: '#004A98',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <MdVisibility /> Details
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 120px)' }}>
      {/* Stats Overview - Updated for new statuses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#004A98', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdAssignment style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 4px 0' }}>Total Inspections</h3>
              <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#004A98' }}>{totalInspections}</p>
            </div>
          </div>
        </div>
        
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#28a745', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdCheckCircle style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 4px 0' }}>No Issues</h3>
              <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#28a745' }}>{noIssuesItems}</p>
            </div>
          </div>
        </div>
        
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dc3545', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdCancel style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 4px 0' }}>With Issues</h3>
              <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#dc3545' }}>{withIssuesItems}</p>
            </div>
          </div>
        </div>
        
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ffc107', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiClock style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 4px 0' }}>To be Inspected</h3>
              <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#ffc107' }}>{toBeInspectedItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ color: '#004A98', margin: '0 0 8px 0', fontSize: 20 }}>Inspection Status</h2>
            <p style={{ color: '#666', margin: 0, fontSize: 14 }}>Monitor and manage serial inspections</p>
          </div>
          
          {/* View Toggle Only */}
          <div style={{ display: 'flex', background: '#f8f9fa', borderRadius: 6, padding: 4 }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '8px 16px',
                background: viewMode === 'table' ? '#004A98' : 'transparent',
                color: viewMode === 'table' ? '#fff' : '#666',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 16px',
                background: viewMode === 'grid' ? '#004A98' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : '#666',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Card View
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search by serial title, volume, supplier, or inspector..."
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
                <p style={{ margin: '0 0 8px 0', fontWeight: 500, fontSize: 14 }}>Filter by Status</p>
                {/* Updated filter options */}
                {['All', 'No Issues', 'With Issues', 'To be Inspected'].map(status => (
                  <label key={status} style={{ display: 'block', marginBottom: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="radio"
                      checked={statusFilter === status}
                      onChange={() => {
                        setStatusFilter(status);
                        setShowFilter(false);
                      }}
                      style={{ marginRight: 8 }}
                    />
                    {status}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' ? (
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #eee' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  background: 'linear-gradient(90deg, #004A98, #0062f4)',
                  color: '#fff'
                }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Serial Title</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Volume/Issue</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Supplier</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Condition</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Issues</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.map((inspection, index) => {
                  const statusColor = getStatusColor(inspection.status);
                  
                  return (
                    <tr 
                      key={inspection.id} 
                      style={{ 
                        borderBottom: '1px solid #eee',
                        background: index % 2 === 0 ? '#fff' : '#f9f9f9'
                      }}
                    >
                      <td style={{ padding: '16px', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '6px',
                            background: getCategoryColor(inspection.category) + '20',
                            color: getCategoryColor(inspection.category),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: 12,
                            border: `1px solid ${getCategoryColor(inspection.category)}`
                          }}>
                            {inspection.serialTitle.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{inspection.serialTitle}</div>
                            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                              <MdCalendarToday style={{ fontSize: 10, marginRight: 4 }} />
                              {inspection.dateReceived}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontWeight: 500 }}>{inspection.volumeIssue}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: 14 }}>{inspection.supplierName}</div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                          Inspector: {inspection.inspector || 'Unassigned'}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          background: statusColor + '20',
                          color: statusColor,
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-block',
                          border: `1px solid ${statusColor}`
                        }}>
                          {inspection.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {inspection.condition !== 'N/A' ? (
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: getConditionColor(inspection.condition) + '20',
                            color: getConditionColor(inspection.condition),
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'inline-block',
                            border: `1px solid ${getConditionColor(inspection.condition)}`
                          }}>
                            {inspection.condition}
                          </span>
                        ) : (
                          <span style={{ color: '#999', fontSize: '12px' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ 
                          width: 40, 
                          height: 40,
                          borderRadius: '50%',
                          background: inspection.issues > 0 ? '#dc3545' : '#28a745',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: 16,
                          margin: '0 auto'
                        }}>
                          {inspection.issues}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button
                            onClick={() => handleViewDetails(inspection)}
                            style={{
                              padding: '8px 12px',
                              background: '#004A98',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              justifyContent: 'center'
                            }}
                          >
                            <MdVisibility /> View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Card/Grid View */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: 20,
            marginBottom: 30
          }}>
            {filteredInspections.map((inspection) => (
              <InspectionCard key={inspection.id} inspection={inspection} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredInspections.length === 0 && (
          <div style={{ 
            padding: '60px 20px', 
            textAlign: 'center', 
            color: '#666',
            fontSize: '16px'
          }}>
            <MdInfo style={{ fontSize: 48, color: '#ddd', marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#666' }}>No inspections found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Table/Grid Footer */}
        <div style={{ 
          marginTop: 30,
          paddingTop: 20,
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#666',
          fontSize: 14
        }}>
          <div>
            Showing {filteredInspections.length} of {totalInspections} inspections
            {statusFilter !== 'All' && ` (${statusFilter} only)`}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                background: '#28a745'
              }}></div>
              <span>No Issues: {noIssuesItems}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                background: '#dc3545'
              }}></div>
              <span>With Issues: {withIssuesItems}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                background: '#ffc107'
              }}></div>
              <span>To be Inspected: {toBeInspectedItems}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inspection Details Modal */}
      {showDetailsModal && selectedInspection && (
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
          zIndex: 2000,
          padding: 20,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  color: '#004A98', 
                  fontSize: '24px', 
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  {selectedInspection.serialTitle}
                </h2>
                <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
                  {selectedInspection.volumeIssue} • {selectedInspection.category}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '4px',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f0f4f8'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                ×
              </button>
            </div>

            {/* Status Summary */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px'
            }}>
              <div>
                <span style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  background: getStatusColor(selectedInspection.status),
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'inline-block',
                  marginBottom: '12px'
                }}>
                  {selectedInspection.status}
                </span>
                <h3 style={{ margin: '12px 0 4px 0', fontSize: '18px', color: '#333' }}>
                  Inspection Details
                </h3>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minWidth: '120px'
              }}>
                <div style={{ 
                  fontSize: '36px', 
                  fontWeight: 'bold',
                  color: selectedInspection.issues > 0 ? '#dc3545' : '#28a745'
                }}>
                  {selectedInspection.issues}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Issues Found</div>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
              marginBottom: '30px'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', color: '#333', margin: '0 0 16px 0', fontWeight: '600' }}>
                  Serial Information
                </h3>
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Title</strong>
                    <div style={{ fontSize: '15px', color: '#333' }}>{selectedInspection.serialTitle}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Volume/Issue</strong>
                    <div style={{ fontSize: '15px', color: '#333' }}>{selectedInspection.volumeIssue}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Category</strong>
                    <div style={{ fontSize: '15px', color: '#333' }}>{selectedInspection.category}</div>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Condition</strong>
                    <div style={{ fontSize: '15px', color: getConditionColor(selectedInspection.condition) }}>
                      {selectedInspection.condition}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', color: '#333', margin: '0 0 16px 0', fontWeight: '600' }}>
                  Delivery & Inspection
                </h3>
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Supplier</strong>
                    <div style={{ fontSize: '15px', color: '#333' }}>{selectedInspection.supplierName}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Date Received</strong>
                    <div style={{ fontSize: '15px', color: '#333' }}>{selectedInspection.dateReceived}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Inspection Date</strong>
                    <div style={{ fontSize: '15px', color: '#333' }}>
                      {selectedInspection.inspectionDate || 'Not inspected'}
                    </div>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Inspector</strong>
                    <div style={{ fontSize: '15px', color: '#333' }}>
                      {selectedInspection.inspector || 'Not assigned'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', color: '#333', margin: '0 0 16px 0', fontWeight: '600' }}>
                  Inspection Notes
                </h3>
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  height: '100%'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '8px' }}>Inspection Result</strong>
                    <div style={{ fontSize: '15px', color: getStatusColor(selectedInspection.status) }}>
                      {selectedInspection.status}
                      {selectedInspection.issues > 0 ? ` (${selectedInspection.issues} issue${selectedInspection.issues !== 1 ? 's' : ''})` : ''}
                    </div>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '8px' }}>Notes</strong>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#666',
                      lineHeight: '1.6',
                      padding: '12px',
                      background: '#fff',
                      borderRadius: '6px',
                      border: '1px solid #eee',
                      minHeight: '100px'
                    }}>
                      {selectedInspection.notes}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  padding: '12px 24px',
                  background: '#f0f4f8',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  color: '#666',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f0f4f8'}
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

export default function DashboardGSPSInspectionStatus() {
  return (
    <GSPSLayout title="Inspection Status">
      <InspectionStatusGSPS />
    </GSPSLayout>
  );
}