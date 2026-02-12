import React, { useState, useEffect } from 'react';
import InspectionLayout from '@/Layouts/InspectionLayout';
import { Head } from '@inertiajs/react';
import { MdSearch, MdFilterList, MdRefresh, MdCalendarToday } from "react-icons/md";
import { FiCheckCircle, FiClock, FiPackage } from "react-icons/fi";
import axios from 'axios';

export default function ViewByDate() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // API data state
  const [inspectionData, setInspectionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch data on mount and when date changes
  useEffect(() => {
    fetchInspectionDataByDate();
  }, [selectedDate]);
  
  const fetchInspectionDataByDate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/subscriptions/delivery-serials');
      
      if (response.data.success) {
        // Filter by selected date
        const allSerials = response.data.serials || [];
        const filteredByDate = allSerials.filter(s => {
          if (!s.deliveryDate) return false;
          return s.deliveryDate.startsWith(selectedDate);
        });
        
        setInspectionData(filteredByDate);
      }
    } catch (err) {
      console.error('Error fetching inspection data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter data by search
  const filteredData = inspectionData.filter(item => {
    const matchesSearch = 
      (item.serialTitle && item.serialTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.issn && item.issn.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });
  
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Inspected':
        return { background: '#dcfce7', color: '#166534' };
      case 'In Inspection':
        return { background: '#fef3c7', color: '#92400e' };
      case 'Delivered':
        return { background: '#dbeafe', color: '#1e40af' };
      case 'Returned':
        return { background: '#fee2e2', color: '#b91c1c' };
      default:
        return { background: '#e5e7eb', color: '#374151' };
    }
  };

  return (
    <InspectionLayout title="View by Date">
      <Head title="View by Date" />
      
      <div style={{ padding: '24px' }}>
        {/* Date Selector Card */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px 16px',
            background: '#f3f4f6',
            borderRadius: '8px'
          }}>
            <MdCalendarToday size={20} color="#004A98" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1f2937',
                cursor: 'pointer',
                outline: 'none'
              }}
            />
          </div>
          
          <div style={{ 
            flex: 1, 
            minWidth: '200px',
            display: 'flex',
            alignItems: 'center',
            background: '#f3f4f6',
            borderRadius: '8px',
            padding: '0 12px'
          }}>
            <MdSearch size={20} color="#6b7280" />
            <input
              type="text"
              placeholder="Search serials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '12px',
                outline: 'none',
                flex: 1,
                fontSize: '14px'
              }}
            />
          </div>
          
          <button
            onClick={fetchInspectionDataByDate}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#004A98',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            <MdRefresh size={18} />
            Refresh
          </button>
        </div>
        
        {/* Summary */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '16px 20px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <FiPackage size={20} color="#004A98" />
          <span style={{ fontWeight: '500', color: '#374151' }}>
            {filteredData.length} {filteredData.length === 1 ? 'item' : 'items'} found for{' '}
            <strong>{new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</strong>
          </span>
        </div>
        
        {/* Table */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Loading data...
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#b91c1c' }}>
              {error}
            </div>
          ) : filteredData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              No serials found for this date.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Serial Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>ISSN</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Supplier</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Period</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', color: '#1f2937', fontWeight: '500' }}>{item.serialTitle || 'N/A'}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{item.issn || 'N/A'}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{item.supplierName || 'N/A'}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{item.period || 'N/A'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ 
                        ...getStatusStyle(item.deliveryStatus),
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {item.deliveryStatus || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </InspectionLayout>
  );
}
