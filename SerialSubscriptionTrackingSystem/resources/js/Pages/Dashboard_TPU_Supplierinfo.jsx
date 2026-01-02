// resources/js/Pages/Dashboard_TPU_Supplierinfo.jsx
import React, { useState } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { MdSearch, MdFilterList } from "react-icons/md";

function SupplierInfo() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const supplierData = [
    {
      id: 1,
      contactPerson: 'Maria Santos',
      supplierName: 'ABC Books Supplier',
      email: 'abcbooks@email.com',
      phone: '+63 912 345 6789',
      address: 'Makati City',
      status: 'Active'
    },
    {
      id: 2,
      contactPerson: 'Leo Cruz',
      supplierName: 'MedJournal Suppliers Inc.',
      email: 'medjournal@email.com',
      phone: '+63 912 345 7777',
      address: 'Pasig City',
      status: 'Active'
    },
    {
      id: 3,
      contactPerson: 'Leo Cruz',
      supplierName: 'Global Periodicals Co.',
      email: 'globalperiodic@gmail.com',
      phone: '+63 912 345 7777',
      address: 'Pasig City',
      status: 'Active'
    },
    {
      id: 4,
      contactPerson: 'Julian Ramos',
      supplierName: 'EastAsia Books & Journals',
      email: 'eastasia@gmail.com',
      phone: '+63 945 567 8901',
      address: 'Manila City',
      status: 'Active'
    },
    {
      id: 5,
      contactPerson: 'Kean Dela Rosa',
      supplierName: 'MedJournal Suppliers Inc.',
      email: 'medjournal@email.com',
      phone: '+63 956 678 9012',
      address: 'Makati City',
      status: 'Active'
    },
  ];

  const filteredSuppliers = supplierData.filter(supplier => {
    const matchesSearch = 
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || supplier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#004A98', margin: 0 }}>Supplier Information</h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
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
              padding: '10px 16px',
              background: '#f5f5f5',
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
              <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>Filter by Status</p>
              {['All', 'Active', 'Inactive'].map(status => (
                <label key={status} style={{ display: 'block', marginBottom: 6, cursor: 'pointer' }}>
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

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Contact Person</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Supplier Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Phone</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Address</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 16px' }}>{supplier.contactPerson}</td>
                <td style={{ padding: '12px 16px' }}>{supplier.supplierName}</td>
                <td style={{ padding: '12px 16px', color: '#004A98' }}>{supplier.email}</td>
                <td style={{ padding: '12px 16px' }}>{supplier.phone}</td>
                <td style={{ padding: '12px 16px' }}>{supplier.address}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: supplier.status === 'Active' ? '#d4edda' : '#f8d7da',
                    color: supplier.status === 'Active' ? '#155724' : '#721c24',
                    fontSize: 12,
                    fontWeight: 500,
                  }}>
                    {supplier.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, color: '#666', fontSize: 14 }}>
        <div>
          Showing {filteredSuppliers.length} of {supplierData.length} suppliers
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '6px 12px', border: '1px solid #ddd', background: '#fff', borderRadius: 4, cursor: 'pointer' }}>Previous</button>
          <button style={{ padding: '6px 12px', border: '1px solid #004A98', background: '#004A98', color: '#fff', borderRadius: 4, cursor: 'pointer' }}>1</button>
          <button style={{ padding: '6px 12px', border: '1px solid #ddd', background: '#fff', borderRadius: 4, cursor: 'pointer' }}>2</button>
          <button style={{ padding: '6px 12px', border: '1px solid #ddd', background: '#fff', borderRadius: 4, cursor: 'pointer' }}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardTPUSupplierInfo() {
  return (
    <TPULayout title="Supplier Information">
      <SupplierInfo />
    </TPULayout>
  );
}